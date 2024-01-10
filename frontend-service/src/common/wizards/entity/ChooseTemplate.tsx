import React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../../services/permissionsService';

const chooseTemplateSchema = Yup.object({
    template: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
        properties: Yup.object().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
});

const ChooseTemplate: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const param = useParams();
    const { categoryId } = param; // assuming if in category page
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    let entityTemplatesFilteredByCategory: IMongoEntityTemplatePopulated[];
    if (categoryId) {
        entityTemplatesFilteredByCategory = Array.from(entityTemplates.values()).filter((entity) => entity.category._id === categoryId);
    } else {
        entityTemplatesFilteredByCategory = Array.from(entityTemplates.values()).filter((entity) =>
            myPermissions.instancesPermissions.some(({ category }) => category === entity.category._id),
        );
    }

    const activeEntityTemplatesFiltered = entityTemplatesFilteredByCategory.filter((entity) => !entity.disabled);

    return (
        <Autocomplete
            id="template"
            options={activeEntityTemplatesFiltered}
            onChange={(_e, value) => setFieldValue('template', value || '')}
            value={values.template._id ? values.template : null}
            getOptionLabel={(option) => option.displayName}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    error={Boolean(touched.template && errors.template)}
                    fullWidth
                    sx={{
                        '& .MuiInputBase-root': {
                            borderRadius: '10px',
                            width: 300,
                        },
                        '& fieldset': {
                            borderColor: '#CCCFE5',
                            color: '#CCCFE5',
                        },
                        '& label': {
                            color: '#9398C2',
                        },
                    }}
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
