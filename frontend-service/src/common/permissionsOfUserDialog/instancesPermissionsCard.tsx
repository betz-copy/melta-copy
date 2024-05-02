import React from 'react';
import { Card, CardContent, Typography, Grid, Divider, CheckboxProps, FormControlLabel } from '@mui/material';
import { useSelector } from 'react-redux';
import i18next from 'i18next';
import { RootState } from '../../store';
import { Scope } from '../../services/permissionsService';
import PermissionViewIcon from './PermissionViewIcon';
import { MeltaCheckbox } from '../MeltaCheckbox';

type checkboxControlProps = {
    onChange: CheckboxProps['onChange'];
    checked: boolean;
};

type permissionTypeCheckboxProps = {
    read: checkboxControlProps;
    write: checkboxControlProps;
};
const InstancesPermissionsCard: React.FC<{
    viewMode: boolean;
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        permissionType: permissionTypeCheckboxProps;
        scope?: Scope;
    }[];
    checkboxAllProps?: {
        permissionType: permissionTypeCheckboxProps;
        indeterminate: boolean;
    };
}> = ({ categoriesCheckboxProps, viewMode, checkboxAllProps }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const bgcolor = darkMode ? '#242424' : 'white';

    return (
        <Card variant="outlined" sx={{ bgcolor, overflowY: 'auto', maxHeight: 500 }}>
            <CardContent>
                <Grid container spacing={2}>
                    <Grid container sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor }}>
                        <Grid item xs={12}>
                            <Typography sx={{ padding: 2 }} fontWeight="bold">
                                {i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography sx={{ paddingLeft: 2 }} fontWeight="bold">
                                {i18next.t('category')}
                            </Typography>
                        </Grid>
                        <Grid item xs={3} paddingLeft={2}>
                            <Typography fontWeight="bold">{i18next.t('permissions.permissionsOfUserDialog.read')}</Typography>
                            {!viewMode && (
                                <FormControlLabel
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
                        <Grid item xs={3} paddingLeft={2}>
                            <Typography fontWeight="bold">{i18next.t('permissions.permissionsOfUserDialog.write')}</Typography>
                            {!viewMode && (
                                <FormControlLabel
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
                    {categoriesCheckboxProps.map(({ categoryId, categoryDisplayName, disabled, permissionType }) => (
                        <React.Fragment key={categoryId}>
                            <Grid item xs={6}>
                                <Typography>{categoryDisplayName}</Typography>
                            </Grid>
                            <Grid item xs={3}>
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
                            <Grid item xs={3}>
                                {viewMode ? (
                                    <PermissionViewIcon checked={permissionType.write.checked} />
                                ) : (
                                    <MeltaCheckbox
                                        checked={permissionType.write.checked}
                                        onChange={permissionType.write.onChange}
                                        disabled={disabled}
                                    />
                                )}
                            </Grid>
                        </React.Fragment>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
