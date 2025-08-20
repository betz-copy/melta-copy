import i18next from 'i18next';
import * as Yup from 'yup';
import { IChildTemplateFormProperty, IFieldChip } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { matchValueAgainstFilter } from '../../../utils/filters';
import { variableNameValidation } from '../../../utils/validation';
import { filterFieldSchema } from '../../wizards/entityTemplate/AddFields';

const getFilterOperator = (filterField: IFieldChip['filterField']) => {
    const operatorMap: Record<string, string> = {
        equals: '$eq',
        notEqual: '$ne',
        greaterThan: '$gt',
        greaterThanOrEqual: '$gte',
        lessThan: '$lt',
        lessThanOrEqual: '$lte',
        inRange: '$in',
        between: '$between',
        not: '$not',
        contains: '$rgx', // contains always true in the validation
        notContains: '$notContains',
    };

    switch (filterField?.filterType) {
        case 'text':
        case 'number':
        case 'date':
            if (filterField.type === 'inRange') {
                return operatorMap['between'];
            }

            return operatorMap[filterField.type];
        case 'set':
            return filterField.values && filterField.values.length > 0 ? '$in' : null;
        default:
            console.warn('Unsupported filter type:', filterField);
            return null;
    }
};

const getFilterValue = (filterField: IFieldChip['filterField']) => {
    switch (filterField?.filterType) {
        case 'text':
        case 'number':
            return filterField.filter;
        case 'date':
            return filterField.dateTo ? [filterField.dateFrom, filterField.dateTo] : filterField.dateFrom;
        case 'set':
            return filterField.values;
        default:
            console.warn('Unsupported filter type:', filterField);
            return null;
    }
};

const checkMatchValidation = (filterField: IFieldChip['filterField'], fieldName: string, value: any) => {
    const data = { [fieldName]: value };

    const operator = getFilterOperator(filterField);

    if (operator) {
        const filter = {
            [fieldName]: {
                [operator]: getFilterValue(filterField),
            },
        };

        return matchValueAgainstFilter(data, filter);
    }
    return true;
};

const childTemplatePropertySchema = (propKey: string, fieldName: string) =>
    Yup.object({
        defaultValue: Yup.mixed().optional(),
        filters: filterFieldSchema(false),
        isEditableByUser: Yup.boolean().optional(),
        display: Yup.boolean().optional(),
    })
        .optional()
        .test('filter-default-match', i18next.t('validation.matchFilter', { fieldName }), function (value) {
            if (!value) return true;

            const { defaultValue, filters } = value;

            return filters && filters.length && defaultValue
                ? filters.some((filterField) => checkMatchValidation(filterField, propKey, defaultValue))
                : true;
        });

export const childTemplateSchema = (existingNames: string[], existingDisplayNames: string[], parentTemplate: IMongoEntityTemplatePopulated) =>
    Yup.object({
        name: Yup.string()
            .matches(variableNameValidation, i18next.t('validation.variableName'))
            .required(i18next.t('validation.required'))
            .test('unique-name', i18next.t('validation.existingName'), (val) => !existingNames.includes(`${parentTemplate.name}_${val}` || '')),
        displayName: Yup.string()
            .required(i18next.t('validation.required'))
            .test(
                'unique-displayName',
                i18next.t('validation.existingDisplayName'),
                (val) => !existingDisplayNames.includes(`${parentTemplate.displayName}-${val}` || ''),
            ),
        description: Yup.string(),
        category: Yup.object({
            _id: Yup.string().required(i18next.t('validation.required')),
            displayName: Yup.string().required(i18next.t('validation.required')),
        }).required(i18next.t('validation.required')),
        isFilterByCurrentUser: Yup.boolean(),
        isFilterByUserUnit: Yup.boolean(),
        filterByCurrentUserField: Yup.mixed().when('isFilterByCurrentUser', {
            is: true,
            then: () => Yup.string().required(i18next.t('validation.required')),
        }),
        filterByUnitUserField: Yup.mixed().when('isFilterByUserUnit', {
            is: true,
            then: () => Yup.string().required(i18next.t('validation.required')),
        }),
        properties: Yup.object({
            properties: Yup.object()
                .test('at-least-one-property-display', i18next.t('childTemplate.fieldFilterTableNoChecks'), (value) => {
                    if (!value || typeof value !== 'object') return false;
                    return Object.values(value).some((prop) => (prop as IChildTemplateFormProperty)?.display === true);
                })
                .test('validate-each-field-schema', i18next.t('validation.invalidProperty'), function (value) {
                    if (!value || typeof value !== 'object') return false;

                    try {
                        Object.entries(value).forEach(([key, field]) => {
                            childTemplatePropertySchema(key, parentTemplate.properties.properties[key].title).validateSync(field, {
                                abortEarly: false,
                            });
                        });
                        return true;
                    } catch (err) {
                        if (err instanceof Yup.ValidationError) {
                            return this.createError({
                                message: err.errors.join(', '),
                            });
                        }
                        return false;
                    }
                }),
        }),
    });
