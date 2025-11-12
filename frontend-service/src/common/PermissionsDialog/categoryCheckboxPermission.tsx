import { ArrowLeftRounded } from '@mui/icons-material';
import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { FormikProps } from 'formik';
import React, { useState } from 'react';
import { PermissionScope } from '../../interfaces/permissions';
import { PermissionData } from '../../interfaces/users';
import { getChangedTemplatePermission } from '../../utils/permissions/instancePermissions';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
import EntityTemplateCheckboxPermission from './entityTemplateCheckboxPermission';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import PermissionScopeBtn from './PermissionScopeBtn';

const CategoryCheckboxPermission: React.FC<{
    categoryDisplayName: string;
    viewMode: boolean;
    permissionType: permissionTypeCheckboxProps;
    disabled: boolean;
    categoryId: string;
    formikProps: FormikProps<PermissionData>;
    workspaceId: string;
    permissionsPath: string;
    entityTemplates: entityTemplatePermissionDialog[];
}> = ({ categoryDisplayName, viewMode, permissionType, disabled, entityTemplates, formikProps, workspaceId, categoryId, permissionsPath }) => {
    const theme = useTheme();
    const [openEntitiesList, setOpenEntitiesList] = useState(false);
    const categoriesPermission = formikProps.values?.permissions?.[workspaceId]?.instances?.categories ?? {};
    const categoryPermissions = categoriesPermission?.[categoryId] ?? {};
    const templatesPermissions = categoryPermissions?.entityTemplates ?? {};

    const changePermissions = (checked: boolean, templateIds: string[], permissionScope: PermissionScope) =>
        formikProps.setFieldValue(
            `${permissionsPath}.instances.categories`,
            getChangedTemplatePermission(
                categoriesPermission,
                checked,
                permissionScope,
                categoryId,
                templateIds,
                entityTemplates,
                entityTemplates.flatMap(({ childTemplates }) => childTemplates),
            ),
        );

    return (
        <Grid container paddingY={0.5}>
            <Grid size={{ xs: 6 }} display="flex" alignItems="center">
                <IconButton
                    aria-label="arrowLeftRounded"
                    onClick={() => {
                        setOpenEntitiesList((prev) => !prev);
                    }}
                    size="small"
                    sx={{ color: theme.palette.primary.main, padding: '0', marginRight: '5px', transform: '180deg', boxSizing: 'border-box' }}
                >
                    <ArrowLeftRounded sx={{ rotate: openEntitiesList ? '-90deg' : '0deg', transition: 'rotate 0.5s' }} />
                </IconButton>
                <Typography>{categoryDisplayName}</Typography>
            </Grid>
            <Grid size={{ xs: 3 }}>
                <PermissionScopeBtn
                    viewMode={viewMode}
                    defaultChecked={permissionType.read.checked}
                    onChange={permissionType.read.onChange}
                    disabled={disabled || permissionType.write.checked}
                    indeterminate={
                        !categoryPermissions.scope &&
                        !!Object.keys(templatesPermissions ?? {}).length &&
                        Object.keys(templatesPermissions ?? {}).length <= entityTemplates.length
                    }
                />
            </Grid>
            <Grid size={{ xs: 3 }}>
                <PermissionScopeBtn
                    viewMode={viewMode}
                    defaultChecked={permissionType.write.checked}
                    onChange={permissionType.write.onChange}
                    disabled={disabled}
                    indeterminate={
                        categoryPermissions.scope !== PermissionScope.write &&
                        !!Object.values(templatesPermissions ?? {}).filter((templatePermission) => templatePermission.scope === PermissionScope.write)
                            .length &&
                        Object.values(templatesPermissions ?? {}).filter((templatePermission) => templatePermission.scope === PermissionScope.write)
                            .length <= entityTemplates.length
                    }
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Collapse in={openEntitiesList}>
                    {entityTemplates
                        .sort((a, _) => Number(a.isParentTemplateInDifferentCategory))
                        .map((entityTemplateDialog) => (
                            <EntityTemplateCheckboxPermission
                                entityTemplate={entityTemplateDialog}
                                changePermissions={changePermissions}
                                disabled={disabled}
                                permissionType={permissionType}
                                viewMode={viewMode}
                                categoryPermissions={categoryPermissions}
                                key={entityTemplateDialog.id}
                            />
                        ))}
                </Collapse>
            </Grid>
        </Grid>
    );
};

export default CategoryCheckboxPermission;
