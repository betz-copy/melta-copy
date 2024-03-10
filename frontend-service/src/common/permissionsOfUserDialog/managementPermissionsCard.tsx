import React from 'react';
import i18next from 'i18next';
import { Card, CardContent, Checkbox, CheckboxProps, FormControlLabel, FormGroup, Typography } from '@mui/material';
import PermissionViewIcon from './PermissionViewIcon';
import { useDarkModeStore } from '../../stores/darkMode';

type ManagementCheckboxProps = { disabled: boolean; viewMode: boolean; checked: boolean; onChange: CheckboxProps['onChange'] };
const ManagementPermissionsCard: React.FC<{
    permissionsManagement: ManagementCheckboxProps;
    templatesManagement: ManagementCheckboxProps;
    rulesManagement: ManagementCheckboxProps;
    processesManagement: ManagementCheckboxProps;
}> = ({ permissionsManagement, templatesManagement, rulesManagement, processesManagement }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Card variant="outlined" sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <CardContent>
                <Typography style={{ fontWeight: 'bold', cursor: 'default' }}>
                    {i18next.t('permissions.permissionsOfUserDialog.managementTitle')}
                </Typography>
                <FormGroup row>
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.permissionsManagement') as string}
                        labelPlacement="end"
                        disabled={permissionsManagement.disabled}
                        control={
                            permissionsManagement.viewMode ? (
                                <PermissionViewIcon checked={permissionsManagement.checked} />
                            ) : (
                                <Checkbox checked={permissionsManagement.checked} onChange={permissionsManagement.onChange} />
                            )
                        }
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.templatesManagement') as string}
                        labelPlacement="end"
                        disabled={templatesManagement.disabled}
                        control={
                            templatesManagement.viewMode ? (
                                <PermissionViewIcon checked={templatesManagement.checked} />
                            ) : (
                                <Checkbox checked={templatesManagement.checked} onChange={templatesManagement.onChange} />
                            )
                        }
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.rulesManagement') as string}
                        labelPlacement="end"
                        disabled={rulesManagement.disabled}
                        control={
                            rulesManagement.viewMode ? (
                                <PermissionViewIcon checked={rulesManagement.checked} />
                            ) : (
                                <Checkbox checked={rulesManagement.checked} onChange={rulesManagement.onChange} />
                            )
                        }
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.processesManagement') as string}
                        labelPlacement="end"
                        disabled={processesManagement.disabled}
                        control={
                            processesManagement.viewMode ? (
                                <PermissionViewIcon checked={processesManagement.checked} />
                            ) : (
                                <Checkbox checked={processesManagement.checked} onChange={processesManagement.onChange} />
                            )
                        }
                    />
                </FormGroup>
            </CardContent>
        </Card>
    );
};

export default ManagementPermissionsCard;
