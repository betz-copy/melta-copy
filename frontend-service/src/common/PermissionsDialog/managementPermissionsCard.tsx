import { Box, CheckboxProps, FormControlLabel, FormGroup } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useDarkModeStore } from '../../stores/darkMode';
import { MeltaCheckbox } from '../MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';
import { BlueTitle } from '../BlueTitle';

type ManagementCheckboxProps = { disabled: boolean; viewMode: boolean; checked: boolean; onChange: CheckboxProps['onChange'] };

const ManagementPermissionsCard: React.FC<{
    permissionsManagement: ManagementCheckboxProps;
    templatesManagement: ManagementCheckboxProps;
    rulesManagement: ManagementCheckboxProps;
    processesManagement: ManagementCheckboxProps;
}> = ({ permissionsManagement, templatesManagement, rulesManagement, processesManagement }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Box sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <Box>
                <Box sx={{ background: !darkMode ? '#EBEFFA' : '#1E2A3A', borderRadius: '5px' }}>
                    <BlueTitle
                        title={i18next.t('permissions.permissionsOfUserDialog.managementTitle')}
                        component="p"
                        variant="body1"
                        style={{ marginRight: '5px', padding: '5px', fontWeight: 600 }}
                    />
                </Box>
                <FormGroup row sx={{ marginTop: '5px', justifyContent: 'center' }}>
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
            </Box>
        </Box>
    );
};

export default ManagementPermissionsCard;
