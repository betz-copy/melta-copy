import React from 'react';
import { Card, CardContent, Typography, Grid, Checkbox, Divider, CardHeader } from '@mui/material';
import { useSelector } from 'react-redux';
import i18next from 'i18next';
import { RootState } from '../../store';
import { Scope } from '../../services/permissionsService';
import PermissionViewIcon from './PermissionViewIcon';

const InstancesPermissionsCard: React.FC<{
    viewMode: boolean;
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        checkedRead: boolean;
        checkedWrite: boolean;
        onChangeRead: (event: React.ChangeEvent<HTMLInputElement>) => void;
        onChangeWrite: (event: React.ChangeEvent<HTMLInputElement>) => void;
        scope?: Scope;
    }[];
}> = ({ categoriesCheckboxProps, viewMode }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const bgcolor = darkMode ? '#242424' : 'white';

    return (
        <Card variant="outlined" sx={{ bgcolor, overflowY: 'auto', maxHeight: 450 }}>
            <CardHeader
                title={i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                titleTypographyProps={{ fontWeight: 'bold', cursor: 'default', fontSize: '1rem' }}
                sx={{ bgcolor }}
            />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid container spacing={2} sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor }}>
                        <Grid item xs={6}>
                            <Typography sx={{ paddingLeft: 2 }} fontWeight="bold">
                                {i18next.t('category')}
                            </Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography fontWeight="bold">{i18next.t('permissions.permissionsOfUserDialog.read')}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography fontWeight="bold">{i18next.t('permissions.permissionsOfUserDialog.write')}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                    </Grid>
                    {categoriesCheckboxProps.map(
                        ({ categoryId, categoryDisplayName, disabled, checkedRead, checkedWrite, onChangeRead, onChangeWrite, scope }) =>
                            viewMode ? (
                                <React.Fragment key={categoryId}>
                                    {categoryDisplayName}
                                    <PermissionViewIcon scope={scope} checked={checkedWrite} />
                                </React.Fragment>
                            ) : (
                                <React.Fragment key={categoryId}>
                                    <Grid item xs={6}>
                                        <Typography>{categoryDisplayName}</Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Checkbox size="small" checked={checkedRead} onChange={onChangeRead} disabled={disabled} />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Checkbox size="small" checked={checkedWrite} onChange={onChangeWrite} disabled={disabled} />
                                    </Grid>
                                </React.Fragment>
                            ),
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
