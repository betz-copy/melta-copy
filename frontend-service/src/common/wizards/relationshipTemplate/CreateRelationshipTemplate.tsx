import React, { useEffect } from 'react';
import { TextField, Box, Autocomplete, CircularProgress } from '@mui/material';
import * as Yup from 'yup';

import i18next from 'i18next';
import { toast } from 'react-toastify';
import { RelationshipTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { environment } from '../../../globals';

import { useAxios } from '../../../axios';
import { IMongoEntityTemplate } from '../../../interfaces';

const createRelationshipTemplateNameSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    sourceEntity: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
    destinationEntity: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const CreateRelationshipTemplateName: React.FC<StepComponentProps<RelationshipTemplateWizardValues>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
}) => {
    const [{ data: entityTemplates, loading: entityTemplatesLoading, error: entityTemplatesError }, getEntityTemplates] = useAxios<
        IMongoEntityTemplate[]
    >(environment.api.entityTemplates);

    useEffect(() => {
        getEntityTemplates();
    }, [getEntityTemplates]);

    useEffect(() => {
        if (entityTemplatesError) {
            toast.error('failed to get templates');
        }
    }, [entityTemplatesError]);

    return (
        <>
            <Box margin={1}>
                <TextField
                    name="name"
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="sourceEntity"
                    options={entityTemplates || []}
                    onChange={(e, value) => setFieldValue('sourceEntity', value || '')}
                    loading={entityTemplatesLoading}
                    value={values.sourceEntity._id ? values.sourceEntity : null}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            error={Boolean(touched.sourceEntity && errors.sourceEntity)}
                            fullWidth
                            helperText={touched.sourceEntity && errors.sourceEntity?._id}
                            name="sourceEntity"
                            variant="outlined"
                            label={i18next.t('wizard.sourceEntity')}
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
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="destinationEntity"
                    options={entityTemplates || []}
                    onChange={(e, value) => setFieldValue('destinationEntity', value || '')}
                    loading={entityTemplatesLoading}
                    value={values.destinationEntity._id ? values.destinationEntity : null}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            error={Boolean(touched.destinationEntity && errors.destinationEntity)}
                            fullWidth
                            helperText={touched.sourceEntity && errors.destinationEntity?._id}
                            name="destinationEntity"
                            variant="outlined"
                            label={i18next.t('wizard.destinationEntity')}
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
            </Box>
        </>
    );
};

export { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema };
