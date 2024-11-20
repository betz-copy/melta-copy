import Excel from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { AxiosError } from 'axios';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { excelConfig } from './excelConfig';
import { ServiceError } from '../../express/error';
import {
    ActionErrors,
    ActionTypes,
    IAction,
    IBrokenRule,
    ICreateEntityMetadata,
    IFailedEntity,
} from '../../externalServices/ruleBreachService/interfaces';
import { IBrokenRulePopulated } from '../../externalServices/ruleBreachService/interfaces/populated';
import { IValidationError } from '../../externalServices/instanceService/interfaces/entities';

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

const readExcelFile = async (file: Express.Multer.File, template: IMongoEntityTemplatePopulated) => {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.worksheets[0];

    const expectedName = `${template.displayName}${template._id}`.trim();
    if (!expectedName.includes(worksheet.name)) throw new ServiceError(StatusCodes.BAD_REQUEST, 'invalid excel');

    const actions: IAction[] = [];
    worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;

        const rowData: Record<string, any> = {};

        Object.entries(template.properties.properties).forEach(([key, value], columnIndex) => {
            const cellValue = row.getCell(columnIndex + 1).value;
            const formatCellValue = formatExcel(cellValue, value);
            rowData[key] = formatCellValue;
        });
        const action = { actionType: ActionTypes.CreateEntity, actionMetadata: { templateId: template._id, properties: rowData } };

        actions.push(action);
    });

    return actions;
};

const getBrokenRulesErrorEntities = async (
    rawBrokenRules: IBrokenRule[],
    actions: IAction[],
    populateBrokenRules: (rawBrokenRules: IBrokenRule[]) => Promise<IBrokenRulePopulated[]>,
) => {
    const indexes = new Set<number>();
    const updatedBrokenRules = rawBrokenRules.map((brokenRule) => ({
        ...brokenRule,
        failures: brokenRule.failures.map((failure) => {
            const entityIdNumberMatch = failure.entityId.match(/\d+/);
            const index = entityIdNumberMatch ? Number(entityIdNumberMatch[0]) : 0;

            if (!indexes.has(index)) indexes.add(index);
            const updatedCauses = failure.causes.map((cause) => {
                return { ...cause, instance: { entityId: `$${indexes.size - 1}._id` } };
            });

            return {
                causes: updatedCauses,
                entityId: `$${indexes.size - 1}._id`,
            };
        }),
    }));

    const brokenRulePopulated = await populateBrokenRules(updatedBrokenRules);

    const entities: { properties: Record<string, any> }[] = [];
    const sortedIndexes = [...indexes].sort((a, b) => b - a);

    sortedIndexes.forEach((index) => {
        const action = actions[index];
        entities.push({ properties: (action.actionMetadata as ICreateEntityMetadata).properties });
        actions.splice(index, 1);
    });

    return {
        rawBrokenRules: updatedBrokenRules,
        brokenRules: brokenRulePopulated,
        entities,
    };
};

const getUniqueErrorEntities = (constraint, actions: IAction[], failedEntities: IFailedEntity[]) => {
    const { values } = constraint;
    const indexes = new Set<number>();
    Object.entries(values).forEach(([key, value]) => {
        const index = actions.findIndex((action) => (action.actionMetadata as ICreateEntityMetadata).properties[key] === value);
        if (!indexes.has(index)) indexes.add(index);
    });
    const sortedIndexes = [...indexes].sort((a, b) => b - a);

    sortedIndexes.forEach((index) => {
        const action = actions[index];
        failedEntities.push({
            properties: (action.actionMetadata as ICreateEntityMetadata).properties,
            errors: [{ type: ActionErrors.unique, metadata: constraint }],
        });

        actions.splice(index, 1);
    });
};

const getRequiredErrorEntities = (constraint, actions: IAction[], failedEntities: IFailedEntity[]) => {
    const { index } = constraint;
    failedEntities.push({
        properties: (actions[index].actionMetadata as ICreateEntityMetadata).properties,
        errors: [{ type: ActionErrors.required, metadata: constraint }],
    });
    actions.splice(index, 1);
};

const getValidationErrorEntities = (error: AxiosError, actions: IAction[], failedEntities: IFailedEntity[]) => {
    const errorData = error.response?.data as {
        type: string;
        message: string;
        metadata: {
            properties: Record<string, any> & { index: number };
            errors: { type: ActionErrors.validation; metadata: IValidationError }[];
        };
    };

    const { metadata } = errorData;
    const { properties, errors } = metadata;
    const { index, ...entityProperties } = properties;

    actions.splice(index, 1);
    failedEntities.push({ properties: entityProperties, errors });
};

export { readExcelFile, getBrokenRulesErrorEntities, getUniqueErrorEntities, getRequiredErrorEntities, getValidationErrorEntities };
