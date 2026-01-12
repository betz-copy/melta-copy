import { Autocomplete, Grid, TextField } from '@mui/material';
import { IEntityTemplateMap } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { getRelationshipInstancesCountByTemplateIdRequest } from '../../../services/entitiesService';
import { useUserStore } from '../../../stores/user';
import { getAllWritePermissionEntityTemplates } from '../../../utils/permissions/templatePermissions';
import { variableNameValidation } from '../../../utils/validation';
import { StepComponentProps } from '../index';
import { RelationshipTemplateWizardValues } from './index';

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
    const currentUser = useUserStore((state) => state.user);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const entityTemplatesArray = Array.from(entityTemplates!.values());
    const allowedEntityTemplates = getAllWritePermissionEntityTemplates(entityTemplatesArray, currentUser);

    const { data: areThereRelationshipInstancesByTemplateId } = useQuery(
        ['areThereRelationshipInstancesByTemplateId', (values as RelationshipTemplateWizardValues & { _id: string })._id],
        () => getRelationshipInstancesCountByTemplateIdRequest((values as RelationshipTemplateWizardValues & { _id: string })._id),
        {
            enabled: isEditMode,
            initialData: 0,
        },
    );

    return (
        <Grid container spacing={3} marginBottom={5}>
            <Grid container direction="row" spacing={2} width="100%" wrap="nowrap">
                <TextField
                    name="name"
                    fullWidth
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                />

                <TextField
                    fullWidth
                    name="displayName"
                    label={i18next.t('wizard.displayName')}
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    helperText={touched.displayName && errors.displayName}
                />
            </Grid>
            <Grid container direction="row" spacing={2} width="100%" wrap="nowrap">
                <Autocomplete
                    fullWidth
                    id="sourceEntity"
                    options={allowedEntityTemplates}
                    onChange={(_e, value) => setFieldValue('sourceEntity', value || '')}
                    value={values.sourceEntity._id ? values.sourceEntity : null}
                    getOptionLabel={(option) => option.displayName}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            error={Boolean(touched.sourceEntity && errors.sourceEntity)}
                            helperText={touched.sourceEntity && errors.sourceEntity?._id}
                            name="sourceEntity"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.sourceEntity')}
                        />
                    )}
                />

                <Autocomplete
                    id="destinationEntity"
                    fullWidth
                    options={allowedEntityTemplates}
                    onChange={(_e, value) => setFieldValue('destinationEntity', value || '')}
                    value={values.destinationEntity._id ? values.destinationEntity : null}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            error={Boolean(touched.destinationEntity && errors.destinationEntity)}
                            helperText={touched.sourceEntity && errors.destinationEntity?._id}
                            name="destinationEntity"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.destinationEntity')}
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
};

export { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema };
