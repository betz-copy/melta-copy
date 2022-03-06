import React from 'react';
import { TextField, Box, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { RelationshipTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

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
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates');

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
                    onChange={(_e, value) => setFieldValue('sourceEntity', value || '')}
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
                        />
                    )}
                />
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="destinationEntity"
                    options={entityTemplates || []}
                    onChange={(_e, value) => setFieldValue('destinationEntity', value || '')}
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
                        />
                    )}
                />
            </Box>
        </>
    );
};

export { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema };
