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
                        <Grid item>
                            <Typography>{i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}</Typography>
                        </Grid>
                        <Grid item>
                            {checkboxAllProps && (
                                <FormControlLabel
                                    label={i18next.t('permissions.permissionsOfUserDialog.allCategories') as string}
                                    labelPlacement="start"
                                    control={
                                        <Checkbox
                                            checked={checkboxAllProps.checked}
                                            indeterminate={checkboxAllProps.indeterminate}
                                            onChange={checkboxAllProps.onChange}
                                        />
                                    }
                                />
                            )}
                        </Grid>
                    </Grid>
                    <Grid item>
                        <FormGroup row>
                            {categoriesCheckboxProps.map(({ categoryId, categoryDisplayName, disabled, checked, onChange }) => (
                                <FormControlLabel
                                    key={categoryId}
                                    label={categoryDisplayName}
                                    labelPlacement="top"
                                    disabled={disabled}
                                    control={<Checkbox checked={checked} onChange={onChange} />}
                                />
                            ))}
                        </FormGroup>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
