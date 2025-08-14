import i18next from 'i18next';
import * as Yup from 'yup';
import { IChildTemplateFormProperty } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { variableNameValidation } from '../../../utils/validation';
import { filterFieldSchema } from '../../wizards/entityTemplate/AddFields';
import { checkMatchValidation } from './AddFieldFilterDialog';

const childTemplatePropertySchema = (propKey: string, fieldName: string) =>
    Yup.object({
        defaultValue: Yup.mixed().optional(),
        filters: filterFieldSchema,
        isEditableByUser: Yup.boolean().optional(),
        display: Yup.boolean().optional(),
    }).test('filter-default-match', i18next.t('validation.matchFilter', { fieldName }), function (value) {
        if (!value) return true;

        const { defaultValue, filters } = value;

        console.log({ value, fieldName, propKey });
        console.log({
            res:
                filters && filters.length && defaultValue
                    ? filters.some((filterField) => checkMatchValidation(filterField, propKey, defaultValue))
                    : false,
        });

        return filters && filters.length && defaultValue
            ? filters.some((filterField) => checkMatchValidation(filterField, propKey, defaultValue))
            : true;
    });

export const createChildTemplateSchema = (existingNames: string[], existingDisplayNames: string[], parentTemplate: IMongoEntityTemplatePopulated) =>
    Yup.object({
        name: Yup.string()
            .matches(variableNameValidation, i18next.t('validation.variableName'))
            .required(i18next.t('validation.required'))
            .test('unique-name', i18next.t('validation.existingName'), (val) => !existingNames.includes(val || '')),
        displayName: Yup.string()
            .required(i18next.t('validation.required'))
            .test('unique-displayName', i18next.t('validation.existingDisplayName'), (val) => !existingDisplayNames.includes(val || '')),
        description: Yup.string(),
        category: Yup.object({
            _id: Yup.string().required(i18next.t('validation.required')),
            displayName: Yup.string().required(i18next.t('validation.required')),
        }).required(i18next.t('validation.required')),
        isFilterByCurrentUser: Yup.boolean(),
        isFilterByUserUnit: Yup.boolean(),
        filterByCurrentUserField: Yup.mixed().when('isFilterByCurrentUser', {
            is: true,
            then: Yup.string().required(i18next.t('validation.required')),
            otherwise: Yup.string().nullable().notRequired(),
        }),
        filterByUnitUserField: Yup.mixed().when('isFilterByUserUnit', {
            is: true,
            then: Yup.string().required(i18next.t('validation.required')),
            otherwise: Yup.string().nullable().notRequired(),
        }),
        properties: Yup.object({
            properties: Yup.object()
                .test('at-least-one-property-display', i18next.t('childTemplate.fieldFilterTableNoChecks'), (value) => {
                    if (!value || typeof value !== 'object') return false;

                    return Object.values(value).some((prop: IChildTemplateFormProperty) => prop?.display === true);
                })
                .test('validate-each-field-schema', i18next.t('validation.invalidProperty'), async function (value) {
                    if (!value || typeof value !== 'object') return false;

                    try {
                        await Promise.all(
                            Object.entries(value).map(async ([key, field]) => {
                                await childTemplatePropertySchema(key, parentTemplate.properties.properties[key].title).validate(field, {
                                    abortEarly: false,
                                });
                            }),
                        );
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
