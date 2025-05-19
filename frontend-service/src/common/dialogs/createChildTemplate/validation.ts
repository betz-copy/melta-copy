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
        description: Yup.string().required(i18next.t('validation.required')),
    });
