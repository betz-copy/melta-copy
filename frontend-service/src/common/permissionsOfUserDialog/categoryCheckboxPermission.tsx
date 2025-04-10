import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { FormikProps } from 'formik';
import { _cloneObject } from '@ag-grid-community/core';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import { IUser } from '../../interfaces/users';
import { PermissionScope } from '../../interfaces/permissions';
import { getChangedTemplatePermission } from '../../utils/permissions/instancePermissions';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
import PermissionScopeBtn from './PermissionScopeBtn';

const CategoryCheckboxPermission: React.FC<{
    categoryDisplayName: string;
    viewMode: boolean;
    permissionType: permissionTypeCheckboxProps;
    disabled: boolean;
    categoryId: string;
    formikProps: FormikProps<IUser>;
    workspaceId: string;
    permissionsPath: string;
    entityTemplates: entityTemplatePermissionDialog[];
}> = ({ categoryDisplayName, viewMode, permissionType, disabled, entityTemplates, formikProps, workspaceId, categoryId, permissionsPath }) => {
    const theme = useTheme();
    const [openEntitiesList, setOpenEntitiesList] = useState(false);
    const categoriesPermission = formikProps.values?.permissions?.[workspaceId]?.instances?.categories ?? {};
    const categoryPermissions = categoriesPermission?.[categoryId] ?? {};
    const templatesPermissions = categoryPermissions?.entityTemplates ?? {};

    const changePermissions = (checked: boolean, entityId: string, permissionScope: PermissionScope) =>
        formikProps.setFieldValue(
            `${permissionsPath}.instances.categories`,
            getChangedTemplatePermission(categoriesPermission, checked, permissionScope, categoryId, entityId, entityTemplates),
        );

    return (
        <Grid item container>
            <Grid xs={6} display="flex" alignItems="center">
                <IconButton
                    aria-label="arrowLeftRounded"
                    onClick={() => {
                        setOpenEntitiesList((prev) => !prev);
                    }}
                    size="small"
                    sx={{ color: theme.palette.primary.main, padding: '0', marginRight: '5px', transform: '180deg', boxSizing: 'border-box' }}
                >
                    <ArrowLeftRoundedIcon sx={{ rotate: openEntitiesList ? '-90deg' : '0deg', transition: 'rotate 0.5s' }} />
                </IconButton>
                <Typography>{categoryDisplayName}</Typography>
            </Grid>
            <Grid xs={3}>
                <PermissionScopeBtn
                    viewMode={viewMode}
                    defaultChecked={permissionType.read.checked}
                    onChange={permissionType.read.onChange}
                    disabled={disabled || permissionType.write.checked}
                    indeterminate={
                        !categoryPermissions.scope &&
                        Object.keys(templatesPermissions ?? {}).length > 0 &&
                        Object.keys(templatesPermissions ?? {}).length <= entityTemplates.length
                    }
                />
            </Grid>
            <Grid xs={3}>
                <PermissionScopeBtn
                    viewMode={viewMode}
                    defaultChecked={permissionType.write.checked}
                    onChange={permissionType.write.onChange}
                    disabled={disabled}
                    indeterminate={
                        categoryPermissions.scope !== PermissionScope.write &&
                        Object.values(templatesPermissions ?? {}).filter((templatePermission) => templatePermission.scope === PermissionScope.write)
                            .length > 0 &&
                        Object.values(templatesPermissions ?? {}).filter((templatePermission) => templatePermission.scope === PermissionScope.write)
                            .length <= entityTemplates.length
                    }
                />
            </Grid>
            <Grid xs={12}>
                <Collapse in={openEntitiesList}>
                    {entityTemplates.map((entityCheck) => {
                        return (
                            <Grid container xs={12} key={entityCheck.id}>
                                <Grid xs={1.2} />
                                <Grid xs={4.8} display="flex" alignItems="center">
                                    <Typography fontSize={14.5}>{entityCheck.name}</Typography>
                                </Grid>
                                <Grid xs={0.5} />
                                <Grid xs={2.5}>
                                    <PermissionScopeBtn
                                        viewMode={viewMode}
                                        defaultChecked={
                                            categoryPermissions?.entityTemplates?.[entityCheck.id]?.scope !== undefined || permissionType.read.checked
                                        }
                                        onChange={(_event, checked) => changePermissions(checked, entityCheck.id, PermissionScope.read)}
                                        disabled={
                                            disabled ||
                                            categoryPermissions?.entityTemplates?.[entityCheck.id]?.scope === PermissionScope.write ||
                                            permissionType.write.checked
                                        }
                                        checkboxSx={{ width: '17px', height: '17px' }}
                                    />
                                </Grid>
                                <Grid xs={0.5} />
                                <Grid xs={2.5}>
                                    <PermissionScopeBtn
                                        viewMode={viewMode}
                                        defaultChecked={
                                            categoryPermissions?.entityTemplates?.[entityCheck.id]?.scope === PermissionScope.write ||
                                            permissionType.write.checked
                                        }
                                        onChange={(_event, checked) => changePermissions(checked, entityCheck.id, PermissionScope.write)}
                                        disabled={disabled}
                                        checkboxSx={{ width: '17px', height: '17px' }}
                                    />
                                </Grid>
                            </Grid>
                        );
                    })}
                </Collapse>
            </Grid>
        </Grid>
    );
};

export default CategoryCheckboxPermission;
