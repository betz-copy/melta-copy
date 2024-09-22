import { AddCircle } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import _debounce from 'lodash.debounce';
import PermissionsOfUserDialog from '../../common/permissionsOfUserDialog';
import '../../css/pages.css';
import { ICategoryMap } from '../../interfaces/categories';
import { IUser } from '../../interfaces/users';
import DeletePermissionsOfUserDialog from './deleteDialog';
import SearchInput from '../../common/inputs/SearchInput';
import PermissionsTable, { PermissionsTableRef } from './table';

const PermissionsManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

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

    const [search, setSearch] = useState('');

    useEffect(() => setTitle(i18next.t('permissions.permissionsManagmentPageTitle')), [setTitle]);

    const permissionsTableRef = useRef<PermissionsTableRef<IUser>>(null);

    return (
        <Grid container className="pageMargin" spacing={3}>
            <Grid item container xs={12} spacing={1}>
                <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                    <Grid item flex={1} />
                    <Grid item flex={1}>
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') setQuickFilterText(search);
                            }}
                            placeholder={i18next.t('permissions.searchUser')}
                            size="medium"
                            borderRadius="7px"
                            width="575px"
                            height="40px"
                        />
                    </Grid>
                    <Grid item container flex={1} justifyContent="flex-end">
                        <IconButton onClick={() => setIsCreatePermissionDialogOpen(true)}>
                            <AddCircle color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    {Boolean(categories) && (
                        <PermissionsTable
                            ref={permissionsTableRef}
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
                onSuccess={() => permissionsTableRef.current?.refreshServerSide()}
            />
            <PermissionsOfUserDialog
                mode="create"
                isOpen={isCreatePermissionDialogOpen}
                handleClose={() => setIsCreatePermissionDialogOpen(false)}
                onSuccess={() => permissionsTableRef.current?.refreshServerSide()}
            />
            <PermissionsOfUserDialog
                mode="edit"
                isOpen={editPermissionDialogState.isDialogOpen}
                handleClose={() => setEditPermissionDialogState({ isDialogOpen: false, user: null })}
                existingUser={editPermissionDialogState.user || undefined}
                onSuccess={(user?: IUser) => permissionsTableRef.current?.updateRowDataClientSide(user as IUser)}
            />
        </Grid>
    );
};

export default PermissionsManagement;
