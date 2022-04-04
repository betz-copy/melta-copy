import React from 'react';
import i18next from 'i18next';
import { Card, CardContent, Checkbox, CheckboxProps, FormControlLabel, FormGroup, Typography } from '@mui/material';

type ManagementCheckboxProps = { disabled: boolean; checked: boolean; onChange: CheckboxProps['onChange'] };
const ManagementPermissionsCard: React.FC<{ permissionsManagement: ManagementCheckboxProps; templatesManagement: ManagementCheckboxProps }> = ({
    permissionsManagement,
    templatesManagement,
}) => {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography>{i18next.t('permissions.permissionsOfUserDialog.managementTitle')}</Typography>
                <FormGroup row>
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.permissionsManagement') as string}
                        labelPlacement="end"
                        disabled={permissionsManagement.disabled}
                        control={<Checkbox checked={permissionsManagement.checked} onChange={permissionsManagement.onChange} />}
                    />
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.templatesManagement') as string}
                        labelPlacement="end"
                        disabled={templatesManagement.disabled}
                        control={<Checkbox checked={templatesManagement.checked} onChange={templatesManagement.onChange} />}
                    />
                </FormGroup>
            </CardContent>
        </Card>
    );
};

export default ManagementPermissionsCard;
