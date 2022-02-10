import React, { useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import * as Yup from 'yup';

import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useAxios } from '../../../axios';
import { environment } from '../../../globals';
import { EntityWizardValues } from './index';
import { IMongoEntityTemplate } from '../../../interfaces';
import { StepComponentProps } from '../index';

const chooseTemplateSchema = {
    template: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
        properties: Yup.object().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const ChooseTemplate: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const [{ data: entityTemplates, loading: entityTemplatesLoading, error: entityTemplatesError }] = useAxios<IMongoEntityTemplate[]>(
        environment.api.entityTemplates,
    );

    useEffect(() => {
        if (entityTemplatesError) {
            toast.error('failed to get templates');
        }
    }, [entityTemplatesError]);

    return (
        <Autocomplete
            id="template"
            options={entityTemplates || []}
            onChange={(e, value) => setFieldValue('template', value || '')}
            loading={entityTemplatesLoading}
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
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {entityTemplatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};

export { ChooseTemplate, chooseTemplateSchema };
