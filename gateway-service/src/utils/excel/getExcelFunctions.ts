import Excel from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { AxiosError } from 'axios';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { excelConfig } from './excelConfig';
import { BadRequestError, ServiceError } from '../../express/error';
import {
    ActionErrors,
    ActionTypes,
    IAction,
    IBrokenRuleEntity,
    ICreateEntityMetadata,
    IFailedEntity,
} from '../../externalServices/ruleBreachService/interfaces';
import { IValidationError } from '../../externalServices/instanceService/interfaces/entities';
import { ICreateEntityMetadataPopulated, IUpdateEntityMetadataPopulated } from '../../externalServices/ruleBreachService/interfaces/populated';

const formatExcel = (value: Excel.CellValue | string, propertyTemplate: IEntitySingleProperty) => {
    const { type, format } = propertyTemplate;
    if (value === null) return undefined;

    if (type === 'boolean') {
        if (value === excelConfig.TRUE_TO_HEBREW) return true;
        if (value === excelConfig.FALSE_TO_HEBREW) return false;
    }
    if (type === 'string') {
        if (format === 'date') return new Date(value as string).toLocaleDateString('en-uk');
        if (format === 'date-time') return new Date(value as string).toLocaleString('en-uk');
    }
    if (type === 'array') {
        if (propertyTemplate.items && propertyTemplate.items.type === 'string' && typeof value === 'object' && 'richText' in value)
            return value?.richText.map((item) => item.text).filter((text) => text !== ', ');
    }
    return value;
};

const readExcelFile = async (files: Express.Multer.File[], template: IMongoEntityTemplatePopulated) => {
    const allActions: IAction[] = [];

    await Promise.all(
        files.map(async (file) => {
            const workbook = new Excel.Workbook();
            await workbook.xlsx.readFile(file.path);
            const worksheet = workbook.worksheets[0];

            const expectedName = `${template.displayName}${template._id}`.trim();
            if (!expectedName.includes(worksheet.name)) {
                throw new ServiceError(StatusCodes.BAD_REQUEST, 'Invalid excel', file);
            }

            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex === 1) return;

                const rowData: Record<string, any> = {};
                Object.entries(template.properties.properties).forEach(([key, value], columnIndex) => {
                    const cellValue = row.getCell(columnIndex + 1).value;
                    const formatCellValue = formatExcel(cellValue, value);
                    rowData[key] = formatCellValue;
                });

                allActions.push({
                    actionType: ActionTypes.CreateEntity,
                    actionMetadata: { templateId: template._id, properties: rowData },
                });
            });

            if (allActions.length > 500) throw new BadRequestError('file limit: more than 500 entities', file);
        }),
    );

    return allActions;
};

const getValidationErrorEntities = (error: AxiosError, failedEntities: IFailedEntity[]) => {
    const errorData = error.response?.data as {
        type: string;
        message: string;
        metadata: {
            properties: Record<string, any>;
            errors: { type: ActionErrors.validation; metadata: IValidationError }[];
        };
    };

    const { metadata } = errorData;
    const { properties, errors } = metadata;

    failedEntities.push({ properties, errors });
};

const getPopulatedBrokenRulesErrorEntities = async (allBrokenRulesEntities: IBrokenRuleEntity[]) => {
    return allBrokenRulesEntities.reduce<IBrokenRuleEntity>(
        (accumulator, current, index) => {
            const updatedRawBrokenRules = current.rawBrokenRules.map((rule) => ({
                ...rule,
                failures: rule.failures.map((failure) => {
                    const entityId = `$${index}._id`;

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

            const updatedBrokenRules = current.brokenRules.map((rule) => ({
                ...rule,
                failures: rule.failures.map((failure) => {
                    const entity = `$${index}._id`;

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

            const updatedRawActions = current.rawActions.map((rawAction) => {
                if (rawAction.actionType === ActionTypes.CreateEntity)
                    return {
                        ...rawAction,
                        actionMetadata: {
                            ...rawAction.actionMetadata,
                            properties: { ...(rawAction.actionMetadata as ICreateEntityMetadata).properties, _id: `$${index}._id` },
                        },
                    };
                if (rawAction.actionType === ActionTypes.UpdateEntity)
                    return { ...rawAction, actionMetadata: { ...rawAction.actionMetadata, entityId: `$${index}._id` } };
                return rawAction;
            });

            const updatedActions = current.actions.map((action) => {
                if (action.actionType === ActionTypes.CreateEntity) {
                    return {
                        ...action,
                        ActionMetadata: {
                            ...action.actionMetadata,
                            properties: {
                                ...(action.actionMetadata as ICreateEntityMetadataPopulated).properties,
                                _id: `$${index}._id`,
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
                                    _id: `$${index}._id`,
                                },
                            },
                        },
                    };
                }
                return action;
            });

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

export { readExcelFile, getValidationErrorEntities, getPopulatedBrokenRulesErrorEntities };
