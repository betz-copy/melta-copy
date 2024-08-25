import React, { useEffect } from 'react';
import { TextField, Grid, FormControlLabel, Switch } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../index';
import { IFrameWizardValues } from '.';
import { IMongoIFrame } from '../../../interfaces/iFrames';

// const useCheckNameAvailability = () => {
//     const queryClient = useQueryClient();

//     const checkNameAvailability = async (name: string) => {
//         const allIFrames = queryClient.getQueryData<IMongoIFrame[]>('allIFrames');
//         const nameExists = allIFrames?.some((iFrame) => iFrame.name === name);
//         console.log({ nameExists });
//         return nameExists;
//     };

//     return checkNameAvailability;
// };

const createIFrameDetailsSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    // .test('unique', i18next.t('validation.nameExists'), async function (value) {
    //     console.log('jhjhjhjjh ', { value });

    //     if (!value) return false;
    //     return checkNameAvailability(value);
    // }),
    url: Yup.string().required(i18next.t('validation.required')), // .matches(variableUrlValidation, 'URL is not valid'),
    description: Yup.string(),
    apiToken: Yup.string(),
};

const CreateIFrameDetails: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    console.log({ values });

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
                />
            </Grid>
            <Grid item>
                <TextField
                    name="description"
                    label={i18next.t('wizard.iFrame.description')}
                    value={values.description}
                    onChange={handleChange}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
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
                />
            </Grid>
        </Grid>
    );
};

export { CreateIFrameDetails, createIFrameDetailsSchema };
