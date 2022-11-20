import React from 'react';
import i18next from 'i18next';
import { Card, CardContent, Checkbox, CheckboxProps, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import CheckboxReadOnly from './CheckboxReadOnly';
import { RootState } from '../../store';

type ManagementCheckboxProps = { disabled: boolean; readOnly: boolean; checked: boolean; onChange: CheckboxProps['onChange'] };
const ManagementPermissionsCard: React.FC<{
    permissionsManagement: ManagementCheckboxProps;
    templatesManagement: ManagementCheckboxProps;
    rulesManagement: ManagementCheckboxProps;
}> = ({ permissionsManagement, templatesManagement, rulesManagement }) => {
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
                            permissionsManagement.readOnly ? (
                                <CheckboxReadOnly checked={permissionsManagement.checked} />
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
                            templatesManagement.readOnly ? (
                                <CheckboxReadOnly checked={templatesManagement.checked} />
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
                            rulesManagement.readOnly ? (
                                <CheckboxReadOnly checked={rulesManagement.checked} />
                            ) : (
                                <Checkbox checked={rulesManagement.checked} onChange={rulesManagement.onChange} />
                            )
                        }
                    />
                </FormGroup>
            </CardContent>
        </Card>
    );
};

export default ManagementPermissionsCard;
