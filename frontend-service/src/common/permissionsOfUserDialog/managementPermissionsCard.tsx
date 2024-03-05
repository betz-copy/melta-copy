import React from 'react';
import i18next from 'i18next';
import { Card, CardContent, CheckboxProps, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import PermissionViewIcon from './PermissionViewIcon';
import { RootState } from '../../store';
import { MeltaCheckbox } from '../MeltaCheckbox';

type ManagementCheckboxProps = { disabled: boolean; viewMode: boolean; checked: boolean; onChange: CheckboxProps['onChange'] };
const ManagementPermissionsCard: React.FC<{
    permissionsManagement: ManagementCheckboxProps;
    templatesManagement: ManagementCheckboxProps;
    rulesManagement: ManagementCheckboxProps;
    processesManagement: ManagementCheckboxProps;
}> = ({ permissionsManagement, templatesManagement, rulesManagement, processesManagement }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

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
                                <MeltaCheckbox checked={permissionsManagement.checked} onChange={permissionsManagement.onChange} />
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
                                <MeltaCheckbox checked={templatesManagement.checked} onChange={templatesManagement.onChange} />
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
                                <MeltaCheckbox checked={rulesManagement.checked} onChange={rulesManagement.onChange} />
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
                                <MeltaCheckbox checked={processesManagement.checked} onChange={processesManagement.onChange} />
                            )
                        }
                    />
                </FormGroup>
            </CardContent>
        </Card>
    );
};

export default ManagementPermissionsCard;
