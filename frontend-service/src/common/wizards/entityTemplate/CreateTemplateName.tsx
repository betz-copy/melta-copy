import React from 'react';
import { TextField, Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { variableNameValidation } from '../../../utils/validation';
import { StepComponentProps } from '../index';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';

export const useCreateOrEditTemplateNameSchema = (currentTemplateId?: string) => {
    const queryClient = useQueryClient();

    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates') || new Map();

    const otherTemplates = Array.from(templates.values()).filter((template) => template._id !== currentTemplateId);

    const existingTemplateNames = otherTemplates.map((template) => template.name);
    const existingTemplateDisplayNames = otherTemplates.map((template) => template.displayName);

    return Yup.object({
        name: Yup.string()
            .matches(variableNameValidation, i18next.t('validation.variableName'))
            .required(i18next.t('validation.required'))
            .test('unique-name', i18next.t('validation.existingName'), (value) => {
                return !existingTemplateNames.includes(value || '');
            }),
        displayName: Yup.string()
            .required(i18next.t('validation.required'))
            .test('unique-displayName', i18next.t('validation.existingDisplayName'), (value) => {
                return !existingTemplateDisplayNames.includes(value || '');
            }),
    });
};

const CreateTemplateName = <Values extends { name: string; displayName: string }>({
    values,
    touched,
    errors,
    handleChange,
    isEditMode,
}: React.PropsWithChildren<StepComponentProps<Values, 'isEditMode'>>) => {
    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <TextField
                    name="name"
                    disabled={isEditMode}
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid item>
                <TextField
                    name="displayName"
                    label={i18next.t('wizard.displayName')}
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    helperText={touched.displayName && errors.displayName}
                />
            </Grid>
        </Grid>
    );
};

export { CreateTemplateName };
