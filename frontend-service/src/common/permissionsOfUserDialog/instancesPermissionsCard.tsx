import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import i18next from 'i18next';
import { CheckboxProps } from '@mui/material/Checkbox';
import { RootState } from '../../store';
import { PermissionCheckboxes } from './PermissionCheckboxes';

const InstancesPermissionsCard: React.FC<{
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        checkedRead: boolean;
        checkedWrite: boolean;
        onChangeRead: CheckboxProps['onChange'];
        onChangeWrite: CheckboxProps['onChange'];
    }[];
}> = ({ categoriesCheckboxProps }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Card variant="outlined" sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <CardContent>
                <Typography style={{ fontWeight: 'bold', cursor: 'default', marginBottom: '16px' }}>
                    {i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                </Typography>
                <Grid container spacing={2}>
                    <Grid container item spacing={2}>
                        <Grid item xs={4}>
                            <strong>{i18next.t('Category')}</strong>
                        </Grid>
                        <Grid item xs={4}>
                            <strong>{i18next.t('Read')}</strong>
                        </Grid>
                        <Grid item xs={4}>
                            <strong>{i18next.t('Write')}</strong>
                        </Grid>
                    </Grid>
                    {categoriesCheckboxProps.map(
                        ({ categoryId, categoryDisplayName, disabled, checkedRead, checkedWrite, onChangeRead, onChangeWrite }) => (
                            <Grid container item key={categoryId} spacing={2}>
                                <Grid item xs={4}>
                                    {categoryDisplayName}
                                </Grid>
                                <Grid item xs={4}>
                                    <PermissionCheckboxes
                                        checkedRead={checkedRead}
                                        checkedWrite={checkedWrite}
                                        disabled={disabled}
                                        onChangeRead={onChangeRead}
                                        onChangeWrite={onChangeWrite}
                                    />
                                </Grid>
                            </Grid>
                        ),
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
