import i18next from 'i18next';
import * as Yup from 'yup';
import { variableNameValidation } from '../../../utils/validation';
import { filterFieldSchema } from '../../wizards/entityTemplate/AddFields';
import { checkMatchValidation } from './AddFieldFilterDialog';

const childTemplatePropertySchema = Yup.object({
    defaultValue: Yup.mixed().optional(),
    filters: filterFieldSchema,
    isEditableByUser: Yup.boolean().optional(),
    display: Yup.boolean().optional(),
}).test('filter-default-match', i18next.t('childTemplate.fieldFilterTableMismatch'), function (value, context) {
    if (!value) return true;

    const fieldName = context.path.split('.').pop();
    console.log({ context, fieldName });

    const { defaultValue, filters } = value;
    console.log({ defaultValue, filters });

    if (!defaultValue || !filters || !Array.isArray(filters)) return true;

    return filters.some((filterField) => checkMatchValidation(filterField, fieldName!, defaultValue));
});

export const createChildTemplateSchema = (existingNames: string[], existingDisplayNames: string[]) =>
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
            // properties: Yup.object().test(
            //     'at-least-one-property',
            //     i18next.t('childTemplate.fieldFilterTableNoChecks'),
            //     (value) => Object.keys(value).length > 0,
            // ),
            // .test('validate-each-field-schema', 'Invalid childTemplate property', async function (value) {
            //     if (!value || typeof value !== 'object') return false;
            //     try {
            //         await Promise.all(Object.values(value).map((field) => childTemplatePropertySchema.validate(field)));
            //         return true;
            //     } catch (err: any) {
            //         return this.createError({ message: err.message });
            //     }
            // }), //TODO: fix
        }),
    });
