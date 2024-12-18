import { Collapse, Divider, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { MeltaCheckbox } from '../MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import { changeGivenInstancePermission, checkUserInstancePermission, clearChildPermissions } from '../../utils/permissions/instancePermissions';
import { PermissionScope } from '../../interfaces/permissions';
import { InstancesSubclassesPermissions } from '../../interfaces/permissions/permissions';

const CategoryCheckboxPermission: React.FC<{
    categoryDisplayName: string;
    viewMode: boolean;
    categoryEntity: any;
    permissionType: permissionTypeCheckboxProps;
    disabled: boolean;
    categoryId: string;
    entityTemplates: any;
    currentPermissions: any;
    formikProps: any;
    permissionsPath: any;
}> = ({
    categoryDisplayName,
    viewMode,
    permissionType,
    disabled,
    entityTemplates,
    currentPermissions,
    formikProps,
    permissionsPath,
    categoryId,
    categoryEntity,
}) => {
    const theme = useTheme();
    const [openEntitiesList, setOpenEntitiesList] = useState(false);
    const entityPermissions = currentPermissions?.instances?.entityTemplates ?? {};

    // console.log({ currentPermissions });

    // console.log({ entityPermissions });

    // console.log({ permissionType });

    console.log(formikProps?.values?.permissions?.['675581a76f6999455dbb3e5a']?.instances);

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
                        onChange={(event, checked) => {
                            let newPermissions = changeGivenInstancePermission(
                                categoryEntity,
                                currentPermissions,
                                InstancesSubclassesPermissions.categories,
                                checked,
                                categoryId,
                                PermissionScope.read,
                            );

                            if (checked) {
                                newPermissions = clearChildPermissions(
                                    categoryEntity.get(categoryId).entityTemplates,
                                    newPermissions,
                                    InstancesSubclassesPermissions.entityTemplates,
                                    categoryId,
                                    PermissionScope.read,
                                );
                            }

                            formikProps.setFieldValue(`${permissionsPath}.instances`, {
                                ...newPermissions,
                            });
                        }}
                        disabled={disabled || permissionType.write.checked}
                    />
                )}
            </Grid>
            <Grid xs={3}>
                {viewMode ? (
                    <PermissionViewIcon checked={permissionType.write.checked} />
                ) : (
                    <MeltaCheckbox
                        checked={permissionType.write.checked}
                        onChange={(event, checked) => {
                            let newPermissions = changeGivenInstancePermission(
                                categoryEntity,
                                currentPermissions,
                                InstancesSubclassesPermissions.categories,
                                checked,
                                categoryId,
                                PermissionScope.write,
                            );

                            if (checked) {
                                newPermissions = clearChildPermissions(
                                    categoryEntity.get(categoryId).entityTemplates,
                                    newPermissions,
                                    InstancesSubclassesPermissions.entityTemplates,
                                    categoryId,
                                    PermissionScope.write,
                                );
                            }

                            formikProps.setFieldValue(`${permissionsPath}.instances`, {
                                ...newPermissions,
                            });
                        }}
                        disabled={disabled}
                    />
                )}
            </Grid>
            <Grid xs={12}>
                <Collapse in={openEntitiesList}>
                    {entityTemplates.map((entityCheck) => {
                        // console.log({ entityCheck });

                        return (
                            <Grid container xs={12} key={entityCheck._id}>
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
                                                permissionType.read.checked ||
                                                checkUserInstancePermission(
                                                    InstancesSubclassesPermissions.entityTemplates,
                                                    currentPermissions,
                                                    entityCheck.id,
                                                    PermissionScope.read,
                                                )
                                            }
                                            onChange={(event, checked) => {
                                                const newPermissions = changeGivenInstancePermission(
                                                    categoryEntity,
                                                    currentPermissions,
                                                    InstancesSubclassesPermissions.entityTemplates,
                                                    checked,
                                                    entityCheck.id,
                                                    PermissionScope.read,
                                                    { id: categoryId, type: InstancesSubclassesPermissions.categories },
                                                );

                                                formikProps.setFieldValue(`${permissionsPath}.instances`, {
                                                    ...newPermissions,
                                                });
                                            }}
                                            disabled={
                                                disabled ||
                                                checkUserInstancePermission(
                                                    InstancesSubclassesPermissions.entityTemplates,
                                                    currentPermissions,
                                                    entityCheck.id,
                                                    PermissionScope.write,
                                                ) ||
                                                checkUserInstancePermission(
                                                    InstancesSubclassesPermissions.categories,
                                                    currentPermissions,
                                                    categoryId,
                                                    PermissionScope.write,
                                                )
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
                                                permissionType.write.checked ||
                                                checkUserInstancePermission(
                                                    InstancesSubclassesPermissions.entityTemplates,
                                                    currentPermissions,
                                                    entityCheck.id,
                                                    PermissionScope.write,
                                                )
                                            }
                                            onChange={(event, checked) => {
                                                const newPermissions = changeGivenInstancePermission(
                                                    categoryEntity,
                                                    currentPermissions,
                                                    InstancesSubclassesPermissions.entityTemplates,
                                                    checked,
                                                    entityCheck.id,
                                                    PermissionScope.write,
                                                    { id: categoryId, type: InstancesSubclassesPermissions.categories },
                                                );

                                                formikProps.setFieldValue(`${permissionsPath}.instances`, {
                                                    ...newPermissions,
                                                });
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
