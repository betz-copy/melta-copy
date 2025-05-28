import { Box, CheckboxProps, FormControlLabel, FormGroup } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useDarkModeStore } from '../../stores/darkMode';
import { MeltaCheckbox } from '../MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';
import { BlueTitle } from '../BlueTitle';

type ManagementCheckboxProps = {
    disabled: boolean;
    viewMode: boolean;
    isChecked: (property: string) => boolean;
    onChange: (checked: boolean, property: string, isManagement?: boolean) => void;
};

const ManagementPermissionsCard: React.FC<ManagementCheckboxProps> = ({ disabled, viewMode, isChecked, onChange }) => {
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
                        disabled={disabled}
                        control={
                            viewMode ? (
                                <PermissionViewIcon checked={isChecked('permissions')} />
                            ) : (
                                <MeltaCheckbox checked={isChecked('permissions')} onChange={(_e, checked) => {onChange(checked, 'permissions', true)}} disabled={disabled} />
                            )
                        }
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.templatesManagement') as string}
                        labelPlacement="end"
                        disabled={disabled}
                        control={
                            viewMode ? (
                                <PermissionViewIcon checked={isChecked('templates')} />
                            ) : (
                                <MeltaCheckbox checked={isChecked('templates')} onChange={(_e, checked) => onChange(checked, 'templates')} disabled={disabled} />
                            )
                        }
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.rulesManagement') as string}
                        labelPlacement="end"
                        disabled={disabled}
                        control={
                            viewMode ? (
                                <PermissionViewIcon checked={isChecked('rules')} />
                            ) : (
                                <MeltaCheckbox checked={isChecked('rules')} onChange={(_e, checked) => onChange(checked, 'rules')} disabled={disabled} />
                            )
                        }
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.processesManagement') as string}
                        labelPlacement="end"
                        disabled={disabled}
                        control={
                            viewMode ? (
                                <PermissionViewIcon checked={isChecked('processes')} />
                            ) : (
                                <MeltaCheckbox checked={isChecked('processes')} onChange={(_e, checked) => onChange(checked, 'processes')} disabled={disabled} />
                            )
                        }
                    />
                </FormGroup>
            </Box>
        </Box>
    );
};

export default ManagementPermissionsCard;
