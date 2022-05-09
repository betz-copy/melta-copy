import React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const chooseTemplateSchema = {
    template: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
        properties: Yup.object().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const ChooseTemplate: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const param = useParams();
    const { categoryId } = param;
    const queryClient = useQueryClient();

    const entityTemplates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!
        .filter((entity) => entity.category._id === categoryId);

    return (
        <Autocomplete
            id="template"
            options={entityTemplates}
            onChange={(_e, value) => setFieldValue('template', value || '')}
            value={values.template._id ? values.template : null}
            getOptionLabel={(option) => option.displayName}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={Boolean(touched.template && errors.template)}
                    fullWidth
                    sx={{ width: 300 }}
                    helperText={(touched.template && errors.template?._id) || errors.template?.displayName || errors.template?.properties}
                    name="template"
                    variant="outlined"
                    label={i18next.t('entityTemplate')}
                />
            )}
        />
    );
};

export { ChooseTemplate, chooseTemplateSchema };
