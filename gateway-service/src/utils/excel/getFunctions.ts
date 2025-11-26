import {
    ActionErrors,
    ActionTypes,
    BadRequestError,
    CoordinateSystem,
    extractUtmLocation,
    getCoordinateSystem,
    IAction,
    IActionPopulated,
    IBrokenRule,
    IBrokenRuleEntity,
    IBrokenRulePopulated,
    IChildTemplatePopulated,
    IChildTemplateProperty,
    ICreateEntityMetadata,
    ICreateEntityMetadataPopulated,
    IEntity,
    IEntitySingleProperty,
    IEntityWithDirectRelationships,
    IEntityWithIgnoredRules,
    IFailedEntity,
    IMongoEntityTemplatePopulated,
    IUpdateEntityMetadataPopulated,
    IValidationErrorData,
    isChildTemplate,
    isValidUTM,
    isValidWGS84,
    locationConverterToString,
    logger,
    ServiceError,
    stringToCoordinates,
    UploadedFile,
} from '@microservices/shared';
import { AxiosError } from 'axios';
import Excel, { CellModel } from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import UserService from '../../externalServices/userService';
import excelConfig from './excelConfig';

const { invalidDate, invalidTime, invalidLocation, invalidUnit } = config.loadExcel;

const formatExcel = (
    value: Excel.CellValue | string,
    propertyTemplate: IEntitySingleProperty,
    isEditMode: boolean,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    unitsMap: Map<string, string>,
) => {
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
            if (format === 'fileId') return (value as CellModel).text;
            if (format === 'location') {
                const locationString = value as string;
                const coordinateSystem = getCoordinateSystem(locationString);

                if (coordinateSystem === CoordinateSystem.WGS84) {
                    const wgs84Location = stringToCoordinates(locationString).value;
                    if (!isValidWGS84(wgs84Location)) throw new BadRequestError(invalidLocation);
                    const location = { location: locationString, coordinateSystem };
                    return isEditMode ? location : JSON.stringify(location);
                }
                const utmLocation = extractUtmLocation(locationString);

                if (!isValidUTM(utmLocation)) throw new BadRequestError(invalidLocation);
                const location = { location: locationConverterToString(locationString), coordinateSystem };
                return isEditMode ? location : JSON.stringify(location);
            }
            if (format === 'unitField') {
                let normalizedValue = value;

                if (typeof value === 'object' && 'richText' in value) {
                    normalizedValue = value.richText.map((text) => text.text).join('');
                }

                const unitId = unitsMap.get(normalizedValue as string);
                if (!unitId) throw new BadRequestError(invalidUnit, { name: value });
                return unitId;
            }
            if (format === 'relationshipReference') {
                const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId;
                if (!relatedTemplateId) return value;
                const relatedTemplate = relatedTemplatesMap[relatedTemplateId];
                const identifierField = Object.entries(relatedTemplate!.properties.properties).find(([_key, val]) => val.identifier)?.[0];

                const formattedValue = formatExcel(
                    value,
                    relatedTemplate!.properties.properties[identifierField!],
                    isEditMode,
                    relatedTemplatesMap,
                    unitsMap,
                );
                return formattedValue;
            }

            return value?.toString();
        case 'array':
            if (propertyTemplate.items && propertyTemplate.items.type === 'string' && typeof value === 'object' && 'richText' in value)
                return value?.richText.map((item) => item.text).filter((text) => text !== ', ' && text !== ',');
            if (format === 'fileId') return (value as CellModel).text;
            if (propertyTemplate.items && propertyTemplate.items?.format === 'user' && typeof value !== 'string' && value) {
                return value
                    .toString()
                    .split(',')
                    .map((val) => val.trim());
            }
            return (value as string).split(',').map((val) => val.trim());
        case 'number':
            return Number.isNaN(parseFloat(value as string)) ? value : parseFloat(value as string);
        default:
            break;
    }
    return value;
};

export const isIncludedColumn = (propertyTemplate: IEntitySingleProperty | (IEntitySingleProperty & IChildTemplateProperty)) => {
    const forbiddenFormats = ['fileId', 'signature', 'comment', 'kartoffelUserField'];
    const forbiddenItemFormats = ['fileId'];

    const invalidFormats =
        forbiddenFormats.includes(propertyTemplate.format ?? '') ||
        (propertyTemplate.type === 'array' && forbiddenItemFormats.includes(propertyTemplate.items?.format ?? ''));
    const isSerialNumber = propertyTemplate.type === 'number' && !!propertyTemplate.serialCurrent;
    const isDisplay = 'display' in propertyTemplate ? !!propertyTemplate.display : true;

    return !invalidFormats && !isSerialNumber && isDisplay;
};

export const isIncludedEditColumn = (propertyTemplate: IEntitySingleProperty, entityDisabled: boolean, templateDisabled: boolean) => {
    const forbiddenFormats = ['relationshipReference', 'user'];
    const forbiddenItemFormats = ['user'];

    const invalidFormats =
        forbiddenFormats.includes(propertyTemplate.format ?? '') ||
        (propertyTemplate.type === 'array' && forbiddenItemFormats.includes(propertyTemplate.items?.format ?? ''));

    return (
        !invalidFormats &&
        isIncludedColumn(propertyTemplate) &&
        !propertyTemplate.readOnly &&
        !propertyTemplate.identifier &&
        !entityDisabled &&
        !templateDisabled
    );
};

type IFailedProperties = {
    key: string;
    value: IEntitySingleProperty;
    cellValue: Excel.CellValue;
    format: Exclude<IEntitySingleProperty['format'], undefined>;
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
        errors: failedProperties.map(({ key, value, format }) => ({
            type: ActionErrors.validation,
            metadata: {
                message: `must be valid ${format}`,
                path: `/${key}`,
                params: value,
                schemaPath: `#/properties/${key}/type`,
            },
        })),
    };
    failedEntities.push(failedEntity);
};

const getUpdatedEntity = (
    entities: IEntityWithDirectRelationships[],
    entity: IEntity,
    identifier: keyof IEntity['properties'],
    template: IMongoEntityTemplatePopulated | IChildTemplatePopulated,
): IEntity | undefined => {
    const existingEntity = entities.find((e) => e.entity.properties[identifier] === entity.properties[identifier]);

    if (!existingEntity) return undefined;

    const changedProperties = Object.fromEntries(
        Object.entries(entity.properties).filter(([key, value]) => {
            const propertyTemplate = template.properties.properties[key];
            return (
                isIncludedEditColumn(propertyTemplate, existingEntity.entity.properties.disabled, template.disabled) &&
                JSON.stringify(value) !== JSON.stringify(existingEntity.entity.properties[key])
            );
        }),
    );

    if (Object.keys(changedProperties).length) return { ...entity, properties: { ...existingEntity.entity.properties, ...changedProperties } };
    return undefined;
};

export const readExcelFile = async (
    files: UploadedFile[],
    template: IMongoEntityTemplatePopulated | IChildTemplatePopulated,
    failedEntities: IFailedEntity[],
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    workspaceId: string,
    entitiesFileLimit = config.loadExcel.entitiesFileLimit,
    oldEntities: IEntityWithDirectRelationships[] = [],
) => {
    const isEditMode = oldEntities.length > 0;

    const entities: IEntityWithIgnoredRules[] = [];
    const columns = Object.fromEntries(
        Object.entries(template.properties.properties).filter(([_propertyKey, propertyTemplate]) => isEditMode || isIncludedColumn(propertyTemplate)),
    );

    const identifier = Object.entries(template.properties.properties).find(([_key, value]) => value.identifier === true)?.[0];
    if (!identifier && isEditMode) throw new BadRequestError('there is no identifier in template', { template });
    let isFailed = false;

    const units = await UserService.getUnits({ workspaceId, disabled: false });
    const unitsMap = new Map(units.map((unit) => [unit.name, unit._id]));

    await Promise.all(
        files.map(async (file) => {
            const workbook = new Excel.Workbook();

            if (!file?.stream) return;

            await workbook.xlsx.read(file.stream);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new BadRequestError(`Can't read excel`);

            if (template.displayName.trim() !== worksheet.name.trim()) throw new ServiceError(StatusCodes.BAD_REQUEST, 'Invalid excel', file);

            worksheet.eachRow((row, rowIndex) => {
                isFailed = false;
                if (rowIndex === 1) return; // skip header row
                const failedProperties: IFailedProperties = [];
                const rowData: Record<string, any> = {};

                Object.entries(columns).forEach(([key, value], columnIndex) => {
                    const cellValue = row.getCell(columnIndex + 1).value;
                    try {
                        const formatCellValue = formatExcel(cellValue, value, isEditMode, relatedTemplatesMap, unitsMap);
                        if (formatCellValue === invalidDate) {
                            failedProperties.push({ key, value, cellValue, format: 'date' });
                            isFailed = true;
                        } else rowData[key] = formatCellValue;
                    } catch (error: any) {
                        logger.error("there's an error in the entity", { error });
                        if (error.message.includes(invalidTime)) {
                            failedProperties.push({ key, value, cellValue, format: 'date-time' });
                            isFailed = true;
                        }
                        if (error.message.includes(invalidLocation)) {
                            failedProperties.push({ key, value, cellValue, format: 'location' });
                            isFailed = true;
                        }
                        if (error.message.includes(invalidUnit)) {
                            failedProperties.push({ key, value, cellValue, format: 'unitField' });
                            isFailed = true;
                        }
                    }
                });
                const entity = { templateId: template._id, properties: rowData };
                if (failedProperties.length > 0) handleFailedEntities(rowData, failedProperties, failedEntities);
                else if (isEditMode && !isFailed) {
                    const updatedEntity = getUpdatedEntity(oldEntities, entity, identifier ?? '', template);
                    if (updatedEntity) entities.push({ ...updatedEntity, ignoredRules: [] });
                } else {
                    entities.push({
                        templateId: isChildTemplate(template) ? template.parentTemplate._id : template._id,
                        properties: rowData,
                        ignoredRules: [],
                    });
                }
            });

            if (!isEditMode)
                if (entities.length > entitiesFileLimit) throw new BadRequestError(`file limit: more than ${entitiesFileLimit} entities`, file);
        }),
    );

    return entities;
};

export const getValidationErrorEntities = (error: AxiosError, failedEntities: IFailedEntity[], originalProperties?: IEntity['properties']) => {
    const errorData = error.response?.data as IValidationErrorData;
    const { metadata } = errorData;
    const { properties, errors } = metadata;

    failedEntities.push({ properties: originalProperties ?? properties, errors });
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

export const convertIdOfBrokenRules = async (allBrokenRulesEntities: IBrokenRuleEntity[]) => {
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
