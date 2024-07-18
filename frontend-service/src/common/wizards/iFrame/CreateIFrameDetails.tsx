import React, { useEffect } from 'react';
import { TextField, Grid, FormControlLabel, Switch } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { StepComponentProps } from '../index';
import { IFrameWizardValues } from '.';

const createIFrameDetailsSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    url: Yup.string().required(i18next.t('validation.required')), // .matches(variableUrlValidation, 'URL is not valid'),
    description: Yup.string(),
    apiToken: Yup.string(),
    placeInSideBar: Yup.boolean().default(false),
};

const CreateIFrameDetails: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    const [isInSideBar, setIsInSideBar] = React.useState(values.placeInSideBar || false);

    useEffect(() => {
        // eslint-disable-next-line no-param-reassign
        values.placeInSideBar = isInSideBar;
    }, [isInSideBar]);

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
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid item>
                <TextField
                    name="url"
                    label={i18next.t('wizard.iFrame.url')}
                    value={values.url}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid>
                <FormControlLabel
                    control={
                        <Switch
                            id="placeInSideBar"
                            name="placeInSideBar"
                            onChange={(event) => {
                                console.log(event.target.checked);
                                setIsInSideBar(event.target.checked);
                                handleChange({ ...values, placeInSideBar: event.target.checked });
                            }}
                            checked={isInSideBar}
                            value={values.placeInSideBar}
                        />
                    }
                    label={i18next.t('wizard.iFrame.placeInSideBar')}
                />
            </Grid>
        </Grid>
    );
};

export { CreateIFrameDetails, createIFrameDetailsSchema };
