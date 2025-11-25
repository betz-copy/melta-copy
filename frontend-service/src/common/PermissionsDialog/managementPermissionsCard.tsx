import { Box, FormControlLabel, FormGroup } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useDarkModeStore } from '../../stores/darkMode';
import BlueTitle from '../MeltaDesigns/BlueTitle';
import MeltaCheckbox from '../MeltaDesigns/MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';

interface ManagementPermissionsCardProps {
    disabled: boolean;
    viewMode: boolean;
    isChecked: (property: managementTypes) => boolean;
    onChange: (checked: boolean, property: string, isManagement?: boolean) => void;
}

export type managementTypes = 'permissions' | 'templates' | 'rules' | 'processes' | 'units';

interface ManagementCheckboxProps extends ManagementPermissionsCardProps {
    type: managementTypes;
    permissionsManagement: boolean;
}

const ManagementCheckbox: React.FC<ManagementCheckboxProps> = ({ type, onChange, isChecked, disabled, viewMode, permissionsManagement }) => {
    return (
        <FormControlLabel
            label={i18next.t(`permissions.permissionsOfUserDialog.${type}Management`)}
            labelPlacement="end"
            disabled={disabled}
            control={
                viewMode ? (
                    <PermissionViewIcon checked={isChecked(type)} />
                ) : (
                    <MeltaCheckbox
                        checked={isChecked(type)}
                        onChange={(_e, checked) => {
                            onChange(checked, type, permissionsManagement);
                        }}
                        disabled={disabled}
                    />
                )
            }
            slotProps={{
                typography: { sx: { fontSize: '14px' } },
            }}
        />
    );
};

const ManagementPermissionsCard: React.FC<ManagementPermissionsCardProps> = ({ disabled, viewMode, isChecked, onChange }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const managementTypesArray: managementTypes[] = ['permissions', 'templates', 'rules', 'processes', 'units'];

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
                    {managementTypesArray.map((managementType) => (
                        <ManagementCheckbox
                            key={managementType}
                            type={managementType}
                            disabled={disabled}
                            viewMode={viewMode}
                            isChecked={isChecked}
                            onChange={onChange}
                            permissionsManagement={managementType === 'permissions'}
                        />
                    ))}
                </FormGroup>
            </Box>
        </Box>
    );
};

export default ManagementPermissionsCard;
