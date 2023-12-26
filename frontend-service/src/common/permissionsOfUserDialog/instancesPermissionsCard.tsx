import React from 'react';
import { Card, CardContent, Checkbox, CheckboxProps, FormControlLabel, FormGroup, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import CheckboxReadOnly from './CheckboxReadOnly';
import { RootState } from '../../store';

const InstancesPermissionsCard: React.FC<{
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        readOnly: boolean;
        checked: boolean;
        onChange: CheckboxProps['onChange'];
    }[];
    checkboxAllProps?: {
        checked: boolean;
        indeterminate: boolean;
        onChange: CheckboxProps['onChange'];
    };
}> = ({ categoriesCheckboxProps, checkboxAllProps }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Card variant="outlined" sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <CardContent>
                <Grid container direction="column" spacing={3}>
                    <Grid item container justifyContent="space-between" alignItems="center">
                        <Typography style={{ fontWeight: 'bold', cursor: 'default' }}>
                            {i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                        </Typography>

                        <FormGroup row>
                            {categoriesCheckboxProps.map(({ categoryId, categoryDisplayName, disabled, readOnly, checked, onChange }) => (
                                <FormControlLabel
                                    key={categoryId}
                                    label={categoryDisplayName}
                                    labelPlacement="bottom"
                                    disabled={disabled}
                                    control={readOnly ? <CheckboxReadOnly checked={checked} /> : <Checkbox checked={checked} onChange={onChange} />}
                                />
                            ))}
                        </FormGroup>
                    </Grid>

                    <Grid item container justifyContent="space-between">
                        {checkboxAllProps && (
                            <FormControlLabel
                                label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
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
