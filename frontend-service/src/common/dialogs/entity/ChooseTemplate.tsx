import React, { useState } from 'react';
import { TextField, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { FormikErrors, FormikTouched } from 'formik';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { EntityWizardValues } from '.';
import { checkUserInstanceOfCategoryPermission } from '../../../utils/permissions/instancePermissions';

const chooseTemplateSchema = Yup.object({
    template: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
        properties: Yup.object().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
});

const ChooseTemplate: React.FC<{
    values: EntityWizardValues;
    touched: FormikTouched<EntityWizardValues>;
    errors: FormikErrors<EntityWizardValues>;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void;
}> = ({ values, touched, errors, setFieldValue }) => {
    const param = useParams();
    const { categoryId } = param;
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    let entityTemplatesFilteredByCategory: IMongoEntityTemplatePopulated[] = [];

    if (categoryId) {
        entityTemplatesFilteredByCategory = Array.from(entityTemplates.values()).filter((entity) => {
            return (
                entity.category._id === categoryId &&
                checkUserInstanceOfCategoryPermission(myPermissions.instancesPermissions, entity.category, 'Write')
            );
        });
    } else {
        entityTemplatesFilteredByCategory = Array.from(entityTemplates.values()).filter((entity) => {
            return checkUserInstanceOfCategoryPermission(myPermissions.instancesPermissions, entity.category, 'Write');
        });
    }

    const activeEntityTemplatesFiltered = entityTemplatesFilteredByCategory.filter((entity) => !entity.disabled);

    const [disabled] = useState(!!values.template._id);

    return (
        <Autocomplete
            id="template"
            options={activeEntityTemplatesFiltered}
            onChange={(_e, value) => setFieldValue('template', value || '')}
            value={values.template._id ? values.template : null}
            disabled={disabled}
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
