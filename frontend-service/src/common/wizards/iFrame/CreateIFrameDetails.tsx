import React from 'react';
import { TextField, Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { StepComponentProps } from '../index';
import { IFrameWizardValues } from '.';

const createIFrameDetailsSchema = Yup.object({
    name: Yup.string().required(i18next.t('validation.required')),
    url: Yup.string().url(i18next.t('validation.url')).required(i18next.t('validation.required')),
});

const CreateIFrameDetails: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <TextField
                    name="name"
                    label={i18next.t('wizard.iFrame.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    sx={{ width: '300px' }}
                />
            </Grid>
            <Grid item>
                <TextField
                    name="url"
                    label={i18next.t('wizard.iFrame.url')}
                    value={values.url}
                    onChange={handleChange}
                    error={touched.url && Boolean(errors.url)}
                    helperText={touched.url && errors.url}
                    sx={{ width: '300px' }}
                />
            </Grid>
        </Grid>
    );
};

export { CreateIFrameDetails, createIFrameDetailsSchema };
