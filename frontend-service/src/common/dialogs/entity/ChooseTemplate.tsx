import { Autocomplete, TextField } from '@mui/material';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import * as Yup from 'yup';
import { emptyEntityTemplate, EntityWizardValues } from '.';
import { IChildTemplateMap, IChildTemplatePopulated, IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { useUserStore } from '../../../stores/user';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { getInitialValuesWithDefaults } from './CreateOrEditEntityDialog';
import { useClientSideUserStore } from '../../../stores/clientSideUser';
import { getChildrenWithWritePermission } from '../../../utils/childTemplates';

export enum IChooseTemplateMode {
    TemplatesAndChildren = 'templatesAndChildren',
    OnlyChildren = 'onlyChildren',
}

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
    parentId?: string;
    chooseMode?: IChooseTemplateMode;
    entityId?: string;
    getInitialProperties?: (newTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated) => Record<string, any>;
}> = ({ values, touched, errors, setFieldValue, chooseMode, parentId, getInitialProperties }) => {
    const { categoryId } = useParams<{ categoryId?: string }>();
    const queryClient = useQueryClient();

    const currentUser = useUserStore((state) => state.user);
    const currentClientSideUser = useClientSideUserStore((state) => state.clientSideUser);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;

    const entityTemplatesArray = Array.from(entityTemplates.values());
    const childTemplatesArray = Array.from(childTemplates.values());

    const isAuthorized = (templateId: string, categoryId: string) =>
        checkUserTemplatePermission(currentUser.currentWorkspacePermissions, categoryId, templateId, PermissionScope.write);

    let entityTemplatesFiltered: IMongoEntityTemplatePopulated[] | IChildTemplatePopulated[] = [];

    if (chooseMode === IChooseTemplateMode.OnlyChildren && parentId)
        entityTemplatesFiltered = getChildrenWithWritePermission(childTemplates, parentId, currentUser, currentClientSideUser);
    else {
        const filterEntityTemplates = entityTemplatesArray.filter((template) =>
            categoryId
                ? template.category._id === categoryId && isAuthorized(template._id, categoryId)
                : isAuthorized(template._id, template.category._id),
        );

        const filterChildEntityTemplates = childTemplatesArray.filter((child) =>
            categoryId ? child.category._id === categoryId : isAuthorized(child._id, child.category._id),
        );

        entityTemplatesFiltered = [...filterEntityTemplates, ...filterChildEntityTemplates];
    }

    const activeEntityTemplatesFiltered = entityTemplatesFiltered.filter((entity) => !entity.disabled);

    const [disabled] = useState(!!values.template?._id);

    return (
        <Autocomplete
            id="template"
            options={activeEntityTemplatesFiltered}
            onChange={(_e, value) => {
                const newTemplate = value || emptyEntityTemplate;

                const baseProps = getInitialValuesWithDefaults({
                    attachmentsProperties: {},
                    properties: values.properties,
                    template: newTemplate,
                }).properties;

                const additionalProps = getInitialProperties?.(newTemplate) ?? {};

                setFieldValue('template', newTemplate);
                setFieldValue('properties', {
                    ...baseProps,
                    ...additionalProps,
                });
            }}
            value={values.template?._id ? values.template : null}
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
                    helperText={
                        (touched.template && errors.template?._id) ||
                        errors.template?.displayName ||
                        (typeof errors.template?.properties === 'string' ? errors.template.properties : undefined)
                    }
                    name="template"
                    variant="outlined"
                    label={i18next.t('entityTemplate')}
                />
            )}
        />
    );
};

export { ChooseTemplate, chooseTemplateSchema };
