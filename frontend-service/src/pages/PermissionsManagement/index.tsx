import React, { useState } from 'react';
import i18next from 'i18next';

import { CircularProgress, Grid, IconButton, TextField } from '@mui/material';

import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AddCircle } from '@mui/icons-material';
import Table from './table';
import { getAllPermissionsOfUsersRequest, IPermissionsOfUser } from '../../services/permissionsService';
import { IMongoCategory } from '../../interfaces/categories';
import DeletePermissionsOfUserDialog from './deleteDialog';
import PermissionsOfUserDialog from '../../common/permissionsOfUserDialog';
import { BlueTitle } from '../../common/BlueTitle';

const PermissionsManagement = () => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!; // todo: if getCategories fails dont show UI?

    const { data: permissionsOfUsers, isLoading: isLoadingPermissions } = useQuery('getAllPermissions', () => getAllPermissionsOfUsersRequest(), {
        onError: (error) => {
            console.log('failed loading all permissions:', error);
            toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
        },
    });

    const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState<boolean>(false);
    const [deletePermissionDialogState, setDeletePermissionDialogState] = useState<{
        isDialogOpen: boolean;
        permissionsOfUser: IPermissionsOfUser | null;
    }>({
        isDialogOpen: false,
        permissionsOfUser: null,
    });
    const [editPermissionDialogState, setEditPermissionDialogState] = useState<{
        isDialogOpen: boolean;
        permissionsOfUser: IPermissionsOfUser | null;
    }>({
        isDialogOpen: false,
        permissionsOfUser: null,
    });

    const [quickFilterText, setQuickFilterText] = useState('');

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <BlueTitle
                    title={i18next.t('permissions.permissionsManagmentPageTitle')}
                    variant="h2"
                    component="h1"
                    style={{ textAlign: 'center' }}
                />
            </Grid>
            <Grid item container xs={12} spacing={1}>
                <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                    <Grid item flex={1} />
                    <Grid item flex={1} style={{ width: '600px' }}>
                        <TextField
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                            placeholder={i18next.t('searchLabel')}
                            variant="outlined"
                            fullWidth
                        />
                    </Grid>
                    <Grid item container flex={1} justifyContent="flex-end">
                        <IconButton onClick={() => setIsCreatePermissionDialogOpen(true)}>
                            <AddCircle color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    {isLoadingPermissions && <CircularProgress size={20} />}
                    {Boolean(permissionsOfUsers) && Boolean(categories) && (
                        <Table
                            permissionsOfUsers={permissionsOfUsers!}
                            categories={categories}
                            onDeletePermissionsOfUser={(permissionsOfUser) =>
                                setDeletePermissionDialogState({ isDialogOpen: true, permissionsOfUser })
                            }
                            onEditPermissionsOfUser={(permissionsOfUser) => setEditPermissionDialogState({ isDialogOpen: true, permissionsOfUser })}
                            quickFilterText={quickFilterText}
                        />
                    )}
                </Grid>
            </Grid>
            <DeletePermissionsOfUserDialog
                isOpen={deletePermissionDialogState.isDialogOpen}
                permissionsOfUser={deletePermissionDialogState.permissionsOfUser}
                handleClose={() => setDeletePermissionDialogState({ isDialogOpen: false, permissionsOfUser: null })}
            />
            <PermissionsOfUserDialog mode="create" isOpen={isCreatePermissionDialogOpen} handleClose={() => setIsCreatePermissionDialogOpen(false)} />
            <PermissionsOfUserDialog
                mode="edit"
                isOpen={editPermissionDialogState.isDialogOpen}
                handleClose={() => setEditPermissionDialogState({ isDialogOpen: false, permissionsOfUser: null })}
                existingPermissionsOfUser={editPermissionDialogState.permissionsOfUser || undefined}
            />
        </Grid>
    );
};

export default PermissionsManagement;
