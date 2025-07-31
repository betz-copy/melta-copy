import { Box, CheckboxProps, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { FormikProps } from 'formik';
import { PermissionScope } from '../../interfaces/permissions';
import { useDarkModeStore } from '../../stores/darkMode';
import { MeltaCheckbox } from '../MeltaCheckbox';
import CategoryCheckboxPermission from './categoryCheckboxPermission';
import { PermissionData } from '../../interfaces/users';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
import { BlueTitle } from '../BlueTitle';
import SearchInput from '../inputs/SearchInput';

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
    formikProps: FormikProps<PermissionData>;
    permissionsPath: string;
    workspaceId: string;
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        permissionType: permissionTypeCheckboxProps;
        scope?: PermissionScope;
        entityTemplates: entityTemplatePermissionDialog[];
    }[];
    checkboxAllProps?: {
        permissionType: permissionTypeCheckboxProps;
        disabled?: boolean;
    };
    searchText?: { value: string; set: (text: string) => void };
}> = ({ categoriesCheckboxProps, viewMode, checkboxAllProps, formikProps, permissionsPath, workspaceId, searchText }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const bgcolor = darkMode ? '#242424' : 'white';

    return (
        <Box sx={{ bgcolor, overflowY: 'auto', maxHeight: 500 }}>
            <Box>
                <Grid container rowGap={1}>
                    <Grid container sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor }}>
                        <Grid item xs={12}>
                            <Box sx={{ background: !darkMode ? '#EBEFFA' : '#1E2A3A', borderRadius: '5px' }}>
                                <BlueTitle
                                    title={i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                                    component="p"
                                    variant="body1"
                                    style={{ marginRight: '5px', padding: '5px', fontWeight: 600 }}
                                />
                            </Box>
                        </Grid>
                        <Grid item margin={2}>
                            <SearchInput
                                value={searchText?.value}
                                onChange={(value) => {
                                    searchText?.set(value);
                                }}
                                borderRadius="7px"
                                width="500px"
                                height="40px"
                                showBorder
                            />
                        </Grid>
                        <Grid item xs={6} marginTop="10px">
                            <Typography sx={{ paddingLeft: 2, boxSizing: 'border-box' }} fontWeight="bold">
                                {i18next.t('category')}
                            </Typography>
                        </Grid>
                        <Grid item xs={3} marginTop="10px">
                            <Typography paddingLeft="15px" fontWeight="bold">
                                {i18next.t('permissions.permissionsOfUserDialog.read')}
                            </Typography>
                            {!viewMode && (
                                <FormControlLabel
                                    sx={{ margin: '0' }}
                                    label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
                                    disabled={checkboxAllProps?.disabled}
                                    control={
                                        <MeltaCheckbox
                                            checked={checkboxAllProps?.permissionType.read.checked}
                                            disabled={checkboxAllProps?.permissionType.write.checked || checkboxAllProps?.disabled}
                                            onChange={checkboxAllProps?.permissionType.read.onChange}
                                        />
                                    }
                                />
                            )}
                        </Grid>
                        <Grid item xs={3} marginTop="10px">
                            <Typography paddingLeft="15px" fontWeight="bold">
                                {i18next.t('permissions.permissionsOfUserDialog.write')}
                            </Typography>
                            {!viewMode && (
                                <FormControlLabel
                                    sx={{ margin: '0' }}
                                    label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
                                    disabled={checkboxAllProps?.disabled}
                                    control={
                                        <MeltaCheckbox
                                            checked={checkboxAllProps?.permissionType.write.checked}
                                            onChange={checkboxAllProps?.permissionType.write.onChange}
                                            disabled={checkboxAllProps?.disabled}
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
                                categoryDisplayName={categoryDisplayName}
                                viewMode={viewMode}
                                disabled={disabled}
                                permissionType={permissionType}
                                key={categoryId}
                                formikProps={formikProps}
                                entityTemplates={entityTemplates}
                                permissionsPath={permissionsPath}
                                categoryId={categoryId}
                                workspaceId={workspaceId}
                            />
                            <Grid item xs={12}>
                                <Divider sx={{ opacity: 0.5 }} />
                            </Grid>
                        </>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default InstancesPermissionsCard;
