import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { FormikProps } from 'formik';
import { _cloneObject } from '@ag-grid-community/core';
import { MeltaCheckbox } from '../MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import { IUser } from '../../interfaces/users';
import { PermissionScope } from '../../interfaces/permissions';
import { getChangedTemplatePermission } from '../../utils/permissions/instancePermissions';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';

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
                {viewMode ? (
                    <PermissionViewIcon checked={permissionType.read.checked} />
                ) : (
                    <MeltaCheckbox
                        checked={permissionType.read.checked}
                        onChange={permissionType.read.onChange}
                        disabled={disabled || permissionType.write.checked}
                    />
                )}
            </Grid>
            <Grid xs={3}>
                {viewMode ? (
                    <PermissionViewIcon checked={permissionType.write.checked} />
                ) : (
                    <MeltaCheckbox checked={permissionType.write.checked} onChange={permissionType.write.onChange} disabled={disabled} />
                )}
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
                                    {viewMode ? (
                                        <PermissionViewIcon checked={permissionType.read.checked} />
                                    ) : (
                                        <MeltaCheckbox
                                            checked={
                                                categoryPermissions?.entityTemplates?.[entityCheck.id]?.scope !== undefined ||
                                                permissionType.read.checked
                                            }
                                            onChange={(_event, checked) => {
                                                formikProps.setFieldValue(
                                                    `${permissionsPath}.instances.categories`,
                                                    getChangedTemplatePermission(
                                                        categoriesPermission,
                                                        checked,
                                                        PermissionScope.read,
                                                        categoryId,
                                                        entityCheck.id,
                                                        entityTemplates,
                                                    ),
                                                );
                                            }}
                                            disabled={
                                                disabled ||
                                                categoryPermissions?.entityTemplates?.[entityCheck.id]?.scope === PermissionScope.write ||
                                                permissionType.write.checked
                                            }
                                            height="17px"
                                            width="17px"
                                        />
                                    )}
                                </Grid>
                                <Grid xs={0.5} />
                                <Grid xs={2.5}>
                                    {viewMode ? (
                                        <PermissionViewIcon checked={permissionType.write.checked} />
                                    ) : (
                                        <MeltaCheckbox
                                            checked={
                                                categoryPermissions?.entityTemplates?.[entityCheck.id]?.scope === PermissionScope.write ||
                                                permissionType.write.checked
                                            }
                                            onChange={(_event, checked) => {
                                                formikProps.setFieldValue(
                                                    `${permissionsPath}.instances.categories`,
                                                    getChangedTemplatePermission(
                                                        categoriesPermission,
                                                        checked,
                                                        PermissionScope.write,
                                                        categoryId,
                                                        entityCheck.id,
                                                        entityTemplates,
                                                    ),
                                                );
                                            }}
                                            disabled={disabled}
                                            height="17px"
                                            width="17px"
                                        />
                                    )}
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
