import React from 'react';
import { TextField, Box, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '@microservices/shared';
import { RelationshipTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { variableNameValidation } from '../../../utils/validation';
import { getRelationshipInstancesCountByTemplateIdRequest } from '../../../services/entitiesService';

const createRelationshipTemplateNameSchema = {
    name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    displayName: Yup.string().required(i18next.t('validation.required')),
    sourceEntity: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
    destinationEntity: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const CreateRelationshipTemplateName: React.FC<StepComponentProps<RelationshipTemplateWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
    isEditMode,
}) => {
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const entityTemplatesArray = Array.from(entityTemplates!.values());

    const { data: areThereRelationshipInstancesByTemplateId } = useQuery(
        ['areThereRelationshipInstancesByTemplateId', (values as RelationshipTemplateWizardValues & { _id: string })._id],
        () => getRelationshipInstancesCountByTemplateIdRequest((values as RelationshipTemplateWizardValues & { _id: string })._id),
        {
            enabled: isEditMode,
            initialData: 0,
        },
    );

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
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                />
            </Box>
            <Box margin={1}>
                <TextField
                    name="displayName"
                    label={i18next.t('wizard.displayName')}
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    helperText={touched.displayName && errors.displayName}
                />
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="sourceEntity"
                    options={entityTemplatesArray}
                    onChange={(_e, value) => setFieldValue('sourceEntity', value || '')}
                    value={values.sourceEntity._id ? values.sourceEntity : null}
                    getOptionLabel={(option) => option.displayName}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    renderInput={(params) => (
                        <TextField
                            style={{ width: '220px' }}
                            {...params}
                            error={Boolean(touched.sourceEntity && errors.sourceEntity)}
                            fullWidth
                            helperText={touched.sourceEntity && errors.sourceEntity?._id}
                            name="sourceEntity"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.sourceEntity')}
                        />
                    )}
                />
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="destinationEntity"
                    options={entityTemplatesArray}
                    onChange={(_e, value) => setFieldValue('destinationEntity', value || '')}
                    value={values.destinationEntity._id ? values.destinationEntity : null}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            style={{ width: '220px' }}
                            {...params}
                            error={Boolean(touched.destinationEntity && errors.destinationEntity)}
                            fullWidth
                            helperText={touched.sourceEntity && errors.destinationEntity?._id}
                            name="destinationEntity"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.destinationEntity')}
                        />
                    )}
                />
            </Box>
        </>
    );
};

export { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema };
