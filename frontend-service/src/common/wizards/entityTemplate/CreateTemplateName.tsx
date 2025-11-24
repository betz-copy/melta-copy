import { Grid, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import * as Yup from 'yup';
import { variableNameValidation } from '../../../utils/validation';
import { StepComponentProps } from '../index';

export const useCreateOrEditTemplateNameSchema = (templates: Map<any, any>, currentTemplateId?: string) => {
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
        category: Yup.object({
            displayName: Yup.string().required(i18next.t('validation.required')),
        }).required(i18next.t('validation.required')),
    });
};

const CreateTemplateName = <Values extends { name: string; displayName: string }>({
    values,
    touched,
    errors,
    handleChange,
    isEditMode,
    gridProps,
}: React.PropsWithChildren<StepComponentProps<Values, 'isEditMode'>> & { gridProps?: object }) => {
    return (
        <Grid container sx={gridProps ? { ...gridProps } : { direction: 'column', alignItems: 'center' }} spacing={2}>
            <Grid>
                <TextField
                    name="name"
                    disabled={isEditMode}
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    sx={{ width: '240px' }}
                    helperText={touched.name && errors.name ? String(errors.name) : undefined}
                />
            </Grid>
            <Grid>
                <TextField
                    name="displayName"
                    label={i18next.t('wizard.displayName')}
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    sx={{ width: '240px' }}
                    helperText={touched.displayName && errors.displayName ? String(errors.displayName) : undefined}
                />
            </Grid>
        </Grid>
    );
};

export { CreateTemplateName };
