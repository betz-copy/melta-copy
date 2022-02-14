import React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import * as Yup from 'yup';

import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { RootState } from '../../../store';

const chooseTemplateSchema = {
    template: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
        properties: Yup.object().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const ChooseTemplate: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const entityTemplates = useSelector((state: RootState) => state.globalState.entityTemplates);

    return (
        <Autocomplete
            id="template"
            options={entityTemplates || []}
            onChange={(e, value) => setFieldValue('template', value || '')}
            value={values.template._id ? values.template : null}
            getOptionLabel={(option) => option.displayName}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={Boolean(touched.template && errors.template)}
                    fullWidth
                    helperText={(touched.template && errors.template?._id) || errors.template?.displayName || errors.template?.properties}
                    name="template"
                    variant="outlined"
                    label="template"
                />
            )}
        />
    );
};

export { ChooseTemplate, chooseTemplateSchema };
