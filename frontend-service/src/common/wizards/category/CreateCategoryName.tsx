import React from 'react';
import { TextField, Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { CategoryWizardValues } from './index';
import { StepComponentProps } from '../index';
import { variableNameValidation } from '../../../utils/validation';

const createCategoryNameSchema = {
    name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    displayName: Yup.string().required(i18next.t('validation.required')),
};

const CreateCategoryName: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, touched, errors, handleChange }) => {
    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <TextField
                    name="name"
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

export { CreateCategoryName, createCategoryNameSchema };
