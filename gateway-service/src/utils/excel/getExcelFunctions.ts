import Excel from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { AxiosError } from 'axios';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { excelConfig } from './excelConfig';
import { ServiceError } from '../../express/error';
import { ActionErrors, ActionTypes, IAction, IBrokenRule, IFailedEntity, IRuleEntity } from '../../externalServices/ruleBreachService/interfaces';
import { IEntity, IValidationError } from '../../externalServices/instanceService/interfaces/entities';
import { IBrokenRulePopulated } from '../../externalServices/ruleBreachService/interfaces/populated';

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

const getBrokenRulesErrorEntities = (rawBrokenRules: IBrokenRule[], entity: IEntity) => {
    const updatedBrokenRules = rawBrokenRules.map((brokenRule) => ({
        ...brokenRule,
        failures: brokenRule.failures.map((failure) => {
            const entityId = (failure as any).entity;
            const updatedCauses = failure.causes.map((cause) => {
                return { ...cause, instance: { entityId } };
            });

            return {
                causes: updatedCauses,
                entityId,
            };
        }),
    }));

    return {
        rawBrokenRules: updatedBrokenRules,
        entities: [{ properties: entity.properties }],
    };
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

const getPopulatedBrokenRulesErrorEntities = async (
    allBrokenRulesEntities: IRuleEntity[],
    populateBrokenRules: (rawBrokenRules: IBrokenRule[]) => Promise<IBrokenRulePopulated[]>,
) => {
    const rawBrokenRulesEntities = allBrokenRulesEntities.reduce<IRuleEntity>(
        (accumulator, current, index) => {
            const updatedRawBrokenRules = current.rawBrokenRules.map((rule) => ({
                ...rule,
                failures: rule.failures.map((failure) => {
                    const entityId = `$${index}._id`;

                    const updatedCauses = failure.causes.map((cause) => ({
                        ...cause,
                        instance: { entityId },
                    }));

                    return {
                        ...failure,
                        causes: updatedCauses,
                        entityId,
                    };
                }),
            }));

            return {
                rawBrokenRules: [...accumulator.rawBrokenRules, ...updatedRawBrokenRules],
                entities: [...accumulator.entities, ...current.entities],
            };
        },
        { rawBrokenRules: [], entities: [] },
    );

    return { ...rawBrokenRulesEntities, brokenRules: await populateBrokenRules(rawBrokenRulesEntities.rawBrokenRules) };
};

export { readExcelFile, getBrokenRulesErrorEntities, getValidationErrorEntities, getPopulatedBrokenRulesErrorEntities };
