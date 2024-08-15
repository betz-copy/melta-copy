import { AddCircle } from '@mui/icons-material';
import { CircularProgress, Grid, IconButton, TextField } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import PermissionsOfUserDialog from '../../common/permissionsOfUserDialog';
import '../../css/pages.css';
import { ICategoryMap } from '../../interfaces/categories';
import { IUser } from '../../interfaces/users';
import { searchUsersRequest } from '../../services/userService';
import DeletePermissionsOfUserDialog from './deleteDialog';
import Table from './table';

const PermissionsManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const { data: users, isLoading: isLoadingPermissions } = useQuery('getAllUsers', () => searchUsersRequest({ limit: 1000 }), {
        onError: (error) => {
            // eslint-disable-next-line no-console
            console.log('failed loading all permissions:', error);
            toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
        },
    });

    const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState<boolean>(false);
    const [deletePermissionDialogState, setDeletePermissionDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
    }>({
        isDialogOpen: false,
        user: null,
    });
    const [editPermissionDialogState, setEditPermissionDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
    }>({
        isDialogOpen: false,
        user: null,
    });

    const [quickFilterText, setQuickFilterText] = useState('');

    useEffect(() => setTitle(i18next.t('permissions.permissionsManagmentPageTitle')), [setTitle]);

    return (
        <Grid container className="pageMargin" spacing={3}>
            <Grid item container xs={12} spacing={1}>
                <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                    <Grid item flex={1} />
                    <Grid item flex={1}>
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
                    {Boolean(users) && Boolean(categories) && (
                        <Table
                            users={users!}
                            categories={Array.from(categories.values())}
                            onDeletePermissionsOfUser={(existingUser) => setDeletePermissionDialogState({ isDialogOpen: true, user: existingUser })}
                            onEditPermissionsOfUser={(existingUser) => setEditPermissionDialogState({ isDialogOpen: true, user: existingUser })}
                            quickFilterText={quickFilterText}
                        />
                    )}
                </Grid>
            </Grid>
            <DeletePermissionsOfUserDialog
                isOpen={deletePermissionDialogState.isDialogOpen}
                user={deletePermissionDialogState.user}
                handleClose={() => setDeletePermissionDialogState({ isDialogOpen: false, user: null })}
            />
            <PermissionsOfUserDialog mode="create" isOpen={isCreatePermissionDialogOpen} handleClose={() => setIsCreatePermissionDialogOpen(false)} />
            <PermissionsOfUserDialog
                mode="edit"
                isOpen={editPermissionDialogState.isDialogOpen}
                handleClose={() => setEditPermissionDialogState({ isDialogOpen: false, user: null })}
                existingUser={editPermissionDialogState.user || undefined}
            />
        </Grid>
    );
};

export default PermissionsManagement;
