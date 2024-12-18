import { Card, CardContent, CheckboxProps, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { PermissionScope } from '../../interfaces/permissions';
import { useDarkModeStore } from '../../stores/darkMode';
import { MeltaCheckbox } from '../MeltaCheckbox';
import CategoryCheckboxPermission from './categoryCheckboxPermission';

type checkboxControlProps = {
    onChange: CheckboxProps['onChange'];
    checked: boolean;
};

export type permissionTypeCheckboxProps = {
    read: checkboxControlProps;
    write: checkboxControlProps;
};
const InstancesPermissionsCard: React.FC<{
    viewMode: boolean;
    categoryEntity: any;
    currentPermissions: any;
    formikProps: any;
    permissionsPath: any;
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        permissionType: permissionTypeCheckboxProps;
        scope?: PermissionScope;
        entityTemplates: any[];
    }[];
    checkboxAllProps?: {
        permissionType: permissionTypeCheckboxProps;
        indeterminate: boolean;
    };
}> = ({ categoriesCheckboxProps, viewMode, checkboxAllProps, currentPermissions, formikProps, permissionsPath, categoryEntity }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const bgcolor = darkMode ? '#242424' : 'white';

    return (
        <Card variant="outlined" sx={{ bgcolor, overflowY: 'auto', maxHeight: 500 }}>
            <CardContent>
                <Grid container rowGap={1}>
                    <Grid container sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor }}>
                        <Grid xs={12}>
                            <Typography sx={{ padding: 2, boxSizing: 'border-box' }} fontWeight="bold">
                                {i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                            </Typography>
                        </Grid>
                        <Grid xs={6}>
                            <Typography sx={{ paddingLeft: 2, boxSizing: 'border-box' }} fontWeight="bold">
                                {i18next.t('category')}
                            </Typography>
                        </Grid>
                        <Grid xs={3}>
                            <Typography paddingLeft="15px" fontWeight="bold">
                                {i18next.t('permissions.permissionsOfUserDialog.read')}
                            </Typography>
                            {!viewMode && (
                                <FormControlLabel
                                    sx={{ margin: '0' }}
                                    label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
                                    control={
                                        <MeltaCheckbox
                                            checked={checkboxAllProps?.permissionType.read.checked || checkboxAllProps?.permissionType.write.checked}
                                            disabled={checkboxAllProps?.permissionType.write.checked}
                                            onChange={checkboxAllProps?.permissionType.read.onChange}
                                        />
                                    }
                                />
                            )}
                        </Grid>
                        <Grid xs={3}>
                            <Typography paddingLeft="15px" fontWeight="bold">
                                {i18next.t('permissions.permissionsOfUserDialog.write')}
                            </Typography>
                            {!viewMode && (
                                <FormControlLabel
                                    sx={{ margin: '0' }}
                                    label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
                                    control={
                                        <MeltaCheckbox
                                            checked={checkboxAllProps?.permissionType.write.checked}
                                            onChange={checkboxAllProps?.permissionType.write.onChange}
                                        />
                                    }
                                />
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                    </Grid>
                    {categoriesCheckboxProps.map(({ categoryId, categoryDisplayName, disabled, permissionType, entityTemplates }) => (
                        <>
                            <CategoryCheckboxPermission
                                currentPermissions={currentPermissions}
                                categoryDisplayName={categoryDisplayName}
                                viewMode={viewMode}
                                categoryEntity={categoryEntity}
                                disabled={disabled}
                                permissionType={permissionType}
                                key={categoryId}
                                formikProps={formikProps}
                                entityTemplates={entityTemplates}
                                permissionsPath={permissionsPath}
                                categoryId={categoryId}
                            />
                            <Grid item xs={12}>
                                <Divider sx={{ opacity: 0.5 }} />
                            </Grid>
                        </>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
