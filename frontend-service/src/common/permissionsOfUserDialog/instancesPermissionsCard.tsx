import React from 'react';
import { Card, CardContent, Checkbox, CheckboxProps, FormControlLabel, FormGroup, Grid, Typography } from '@mui/material';
import i18next from 'i18next';

const InstancesPermissionsCard: React.FC<{
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        checked: boolean;
        onChange: CheckboxProps['onChange'];
    }[];
    checkboxAllProps?: {
        checked: boolean;
        indeterminate: boolean;
        onChange: CheckboxProps['onChange'];
    };
}> = ({ categoriesCheckboxProps, checkboxAllProps }) => {
    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container direction="column" spacing={3}>
                    <Grid item container justifyContent="space-between" alignItems="center">
                        <Typography>{i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}</Typography>

                        <FormGroup row>
                            {categoriesCheckboxProps.map(({ categoryId, categoryDisplayName, disabled, checked, onChange }) => (
                                <FormControlLabel
                                    key={categoryId}
                                    label={categoryDisplayName}
                                    labelPlacement="bottom"
                                    disabled={disabled}
                                    control={<Checkbox checked={checked} onChange={onChange} />}
                                />
                            ))}
                        </FormGroup>
                    </Grid>

                    <Grid item container justifyContent="space-between">
                        {checkboxAllProps && (
                            <FormControlLabel
                                label={i18next.t('permissions.permissionsOfUserDialog.chooseAll')}
                                control={<Checkbox checked={checkboxAllProps.checked} onChange={checkboxAllProps.onChange} size="medium" />}
                            />
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
