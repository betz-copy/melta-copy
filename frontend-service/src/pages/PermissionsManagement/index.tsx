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

    const { data: permissionsOfUsers, isLoading: isLoadingPermissions } = useQuery('getAllPermissions', () => searchUsersRequest({ limit: 5 }), {
        onError: (error) => {
            // eslint-disable-next-line no-console
            console.log('failed loading all permissions:', error);
            toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
        },
    });

    const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState<boolean>(false);
    const [deletePermissionDialogState, setDeletePermissionDialogState] = useState<{
        isDialogOpen: boolean;
        permissionsOfUser: IUser | null;
    }>({
        isDialogOpen: false,
        permissionsOfUser: null,
    });
    const [editPermissionDialogState, setEditPermissionDialogState] = useState<{
        isDialogOpen: boolean;
        permissionsOfUser: IUser | null;
    }>({
        isDialogOpen: false,
        permissionsOfUser: null,
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
                    {Boolean(permissionsOfUsers) && Boolean(categories) && (
                        <Table
                            permissionsOfUsers={permissionsOfUsers!}
                            categories={Array.from(categories.values())}
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
