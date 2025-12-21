import { Grid, TextField } from '@mui/material';
import { IMongoCategory } from '@packages/category';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { variableNameValidation } from '../../../utils/validation';
import { StepComponentProps } from '../index';
import { CategoryWizardValues } from './index';

export const useCreateCategoryNameSchema = (currentCategoryId?: string) => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories') || [];

    const otherCategories = Array.from(categories.values()).filter((category) => category._id !== currentCategoryId);

    const existingCategoryNames = otherCategories.map((category) => category.name);
    const existingCategoryDisplayNames = otherCategories.map((category) => category.displayName);

    return Yup.object({
        name: Yup.string()
            .matches(variableNameValidation, i18next.t('validation.variableName'))
            .required(i18next.t('validation.required'))
            .test('unique-name', i18next.t('validation.existingName'), (value) => {
                return !existingCategoryNames.includes(value || '');
            }),
        displayName: Yup.string()
            .required(i18next.t('validation.required'))
            .test('unique-displayName', i18next.t('validation.existingDisplayName'), (value) => {
                return !existingCategoryDisplayNames.includes(value || '');
            }),
    });
};

const CreateCategoryName: React.FC<StepComponentProps<CategoryWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    isEditMode,
}) => {
    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid>
                <TextField
                    name="name"
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    disabled={isEditMode}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>

            <Grid>
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

export { CreateCategoryName };
