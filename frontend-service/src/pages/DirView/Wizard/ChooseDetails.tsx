import { Grid, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import * as Yup from 'yup';
import { WorkspaceTypes } from '@microservices/shared-interfaces';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { StepComponentProps } from '../../../common/wizards/index';
import { workspaceNameValidation } from '../../../utils/validation';
import { WorkspaceWizardValues } from './index';

export const chooseDetailsSchema = {
    name: Yup.string().matches(workspaceNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    displayName: Yup.string().required(i18next.t('validation.required')),
    type: Yup.string().oneOf(Object.values(WorkspaceTypes), i18next.t('validation.required')),
};

export const ChooseDetails: React.FC<StepComponentProps<WorkspaceWizardValues, 'isEditMode'>> = ({ isEditMode, ...props }) => {
    const { values, touched, errors, handleChange } = props;
    const [location] = useLocation();

    return (
        <Grid container direction="column" alignItems="center" spacing={2}>
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

            <Grid item>
                <FormikAutoComplete
                    formik={props}
                    formikField="type"
                    label={i18next.t('workspaces.type')}
                    options={location === '/' ? [WorkspaceTypes.dir] : Object.values(WorkspaceTypes)}
                    getOptionLabel={(option) => i18next.t(`workspaces$types$${option}`, { keySeparator: '$' })}
                    style={{ minWidth: '13.5rem' }}
                    disabled={isEditMode}
                    disableClear
                />
            </Grid>
        </Grid>
    );
};
