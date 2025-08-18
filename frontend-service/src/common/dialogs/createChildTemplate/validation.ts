import * as Yup from 'yup';
import i18next from 'i18next';
import { variableNameValidation } from '../../../utils/validation';

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
            then: () => Yup.string().required(i18next.t('validation.required')),
        }),
        filterByUnitUserField: Yup.mixed().when('isFilterByUserUnit', {
            is: true,
            then: () => Yup.string().required(i18next.t('validation.required')),
        }),
    });
