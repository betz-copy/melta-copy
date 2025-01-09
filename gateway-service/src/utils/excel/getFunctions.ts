import Excel from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { AxiosError } from 'axios';
import fs from 'fs';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { excelConfig } from './excelConfig';
import { BadRequestError, ServiceError } from '../../express/error';
import {
    ActionErrors,
    ActionTypes,
    IAction,
    IActionPopulated,
    IBrokenRule,
    IBrokenRuleEntity,
    ICreateEntityMetadata,
    IFailedEntity,
} from '../../externalServices/ruleBreachService/interfaces';
import { IEntity, IValidationErrorData } from '../../externalServices/instanceService/interfaces/entities';
import {
    IBrokenRulePopulated,
    ICreateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../../externalServices/ruleBreachService/interfaces/populated';
import config from '../../config';

const { entitiesFileLimit, invalidDate, invalidTime } = config.loadExcel;

const formatExcel = (value: Excel.CellValue | string, propertyTemplate: IEntitySingleProperty) => {
    const { type, format } = propertyTemplate;
    if (value === null) return undefined;
    switch (type) {
        case 'boolean':
            if (value === excelConfig.TRUE_TO_HEBREW) return true;
            if (value === excelConfig.FALSE_TO_HEBREW) return false;
            break;
        case 'string':
            if (format === 'email' && typeof value === 'object') return (value as any).text;
            if (format === 'date') return new Date(value as string).toLocaleDateString('en-CA');
            if (format === 'date-time') return new Date(value as string).toISOString();
            return value?.toString();
        case 'array':
            if (propertyTemplate.items && propertyTemplate.items.type === 'string' && typeof value === 'object' && 'richText' in value)
                return value?.richText.map((item) => item.text).filter((text) => text !== ', ' && text !== ',');
            return (value as string).split(',').map((val) => val.trim());
        default:
            break;
    }
    return value;
};

export const isIncludedColumn = (propertyTemplate: IEntitySingleProperty) => {
    const isRelationshipRef = propertyTemplate.format === 'relationshipReference' || propertyTemplate.relationshipReference;
    const isFile = propertyTemplate.format === 'fileId' || (propertyTemplate.type === 'array' && propertyTemplate.items?.format === 'fileId');
    const isSerialNumber = propertyTemplate.type === 'number' && propertyTemplate.serialCurrent;
    return !isRelationshipRef && !isFile && !isSerialNumber;
};

type IFailedProperties = {
    key: string;
    value: IEntitySingleProperty;
    cellValue: Excel.CellValue;
    dateOrTime: 'date' | 'date-time';
}[];

const handleFailedEntities = (rowData: Record<string, any>, failedProperties: IFailedProperties, failedEntities: IFailedEntity[]) => {
    const failedEntityProperties = {
        ...rowData,
        ...failedProperties.reduce((acc, { key, cellValue }) => {
            acc[key] = cellValue;
            return acc;
        }, {}),
    };

    const failedEntity: IFailedEntity = {
        properties: failedEntityProperties,
        errors: failedProperties.map(({ key, value, dateOrTime }) => ({
            type: ActionErrors.validation,
            metadata: {
                message: `must be valid ${dateOrTime ? 'date' : 'date-time'}`,
                path: `/${key}`,
                params: value,
                schemaPath: `#/properties/${key}/type`,
            },
        })),
    };
    failedEntities.push(failedEntity);
};

const readExcelFile = async (files: Express.Multer.File[], template: IMongoEntityTemplatePopulated, failedEntities: IFailedEntity[]) => {
    const entities: IEntity[] = [];
    const columns = Object.fromEntries(
        Object.entries(template.properties.properties).filter(([_propertyKey, propertyTemplate]) => isIncludedColumn(propertyTemplate)),
    );

    await Promise.all(
        files.map(async (file) => {
            const stream = fs.createReadStream(file.path);
            const workbook = new Excel.Workbook();
            await workbook.xlsx.read(stream);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new BadRequestError(`Can't read excel`);

            if (template.displayName.trim() !== worksheet.name.trim()) throw new ServiceError(StatusCodes.BAD_REQUEST, 'Invalid excel', file);

            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex === 1) return; // skip header row
                const failedProperties: IFailedProperties = [];
                const rowData: Record<string, any> = {};

                Object.entries(columns).forEach(([key, value], columnIndex) => {
                    const cellValue = row.getCell(columnIndex + 1).value;
                    try {
                        const formatCellValue = formatExcel(cellValue, value);
                        if (formatCellValue === invalidDate) failedProperties.push({ key, value, cellValue, dateOrTime: 'date' });
                        else rowData[key] = formatCellValue;
                    } catch (error: any) {
                        console.error("there's an error in the entity", { error });
                        if (error.message.includes(invalidTime)) failedProperties.push({ key, value, cellValue, dateOrTime: 'date-time' });
                    }
                });

                if (failedProperties.length > 0) handleFailedEntities(rowData, failedProperties, failedEntities);
                else entities.push({ templateId: template._id, properties: rowData });
            });

            if (entities.length > entitiesFileLimit) throw new BadRequestError(`file limit: more than ${entitiesFileLimit} entities`, file);
        }),
    );

    return entities;
};

const getValidationErrorEntities = (error: AxiosError, failedEntities: IFailedEntity[]) => {
    const errorData = error.response?.data as IValidationErrorData;
    const { metadata } = errorData;
    const { properties, errors } = metadata;

    failedEntities.push({ properties, errors });
};

const updateRawBrokenRules = (rawBrokenRules: IBrokenRule[], entityId: string) => {
    return rawBrokenRules.map((rule) => ({
        ...rule,
        failures: rule.failures.map((failure) => {
            const updatedCauses = failure.causes.map((cause) => ({
                ...cause,
                instance: {
                    entityId,
                },
            }));

            return {
                ...failure,
                causes: updatedCauses,
                entityId,
            };
        }),
    }));
};

const updateBrokenRules = (brokenRules: IBrokenRulePopulated[], entity: string) => {
    return brokenRules.map((rule) => ({
        ...rule,
        failures: rule.failures.map((failure) => {
            const updatedCauses = failure.causes.map((cause) => ({
                ...cause,
                instance: {
                    entity,
                },
            }));

            return {
                ...failure,
                causes: updatedCauses,
                entity,
            };
        }),
    }));
};

const updateRawActions = (rawActions: IAction[], entityId: string) => {
    return rawActions.map((rawAction) => {
        if (rawAction.actionType === ActionTypes.CreateEntity)
            return {
                ...rawAction,
                actionMetadata: {
                    ...rawAction.actionMetadata,
                    properties: { ...(rawAction.actionMetadata as ICreateEntityMetadata).properties, _id: entityId },
                },
            };
        if (rawAction.actionType === ActionTypes.UpdateEntity) return { ...rawAction, actionMetadata: { ...rawAction.actionMetadata, entityId } };
        return rawAction;
    });
};

const updateAction = (actions: IActionPopulated[], _id: string) => {
    return actions.map((action) => {
        if (action.actionType === ActionTypes.CreateEntity) {
            return {
                ...action,
                ActionMetadata: {
                    ...action.actionMetadata,
                    properties: {
                        ...(action.actionMetadata as ICreateEntityMetadataPopulated).properties,
                        _id,
                    },
                },
            };
        }
        if (action.actionType === ActionTypes.UpdateEntity) {
            return {
                ...action,
                ActionMetadata: {
                    ...action.actionMetadata,
                    entity: {
                        properties: {
                            ...(action.actionMetadata as IUpdateEntityMetadataPopulated).entity!.properties,
                            _id,
                        },
                    },
                },
            };
        }
        return action;
    });
};

const updateIdOfBrokenRules = async (allBrokenRulesEntities: IBrokenRuleEntity[]) => {
    return allBrokenRulesEntities.reduce<IBrokenRuleEntity>(
        (accumulator, current, index) => {
            const entityId = `$${index}._id`;

            const updatedRawBrokenRules = updateRawBrokenRules(current.rawBrokenRules, entityId);

            const updatedBrokenRules = updateBrokenRules(current.brokenRules, entityId);

            const updatedRawActions = updateRawActions(current.rawActions, entityId);

            const updatedActions = updateAction(current.actions, entityId);

            return {
                rawBrokenRules: [...accumulator.rawBrokenRules, ...updatedRawBrokenRules],
                brokenRules: [...accumulator.brokenRules, ...updatedBrokenRules],
                actions: [...accumulator.actions, ...updatedActions],
                rawActions: [...accumulator.rawActions, ...updatedRawActions],
                entities: [...accumulator.entities, ...current.entities],
            };
        },
        { rawBrokenRules: [], brokenRules: [], actions: [], rawActions: [], entities: [] },
    );
};

export { readExcelFile, getValidationErrorEntities, updateIdOfBrokenRules };
