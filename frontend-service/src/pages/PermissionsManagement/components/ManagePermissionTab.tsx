import { AddCircle } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import _debounce from 'lodash.debounce';
import PermissionsDialog from '../../../common/PermissionsDialog';
import '../../../css/pages.css';
import { ICategoryMap } from '../../../interfaces/categories';
import { IUser } from '../../../interfaces/users';
import DeletePermissionsDialog from './deleteDialog';
import SearchInput from '../../../common/inputs/SearchInput';
import PermissionsTable, { PermissionsTableRef } from './table';

const ManagePermissionTab: React.FC<{ permissionType: 'role' | 'user'; searchPlaceholder: string }> = ({ permissionType, searchPlaceholder }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
    const [deleteDialogState, setDeleteDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
    }>({
        isDialogOpen: false,
        user: null,
    });
    const [editDialogState, setEditDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
    }>({
        isDialogOpen: false,
        user: null,
    });

    const [quickFilterText, setQuickFilterText] = useState('');

    const [search, setSearch] = useState('');

    const permissionsTableRef = useRef<PermissionsTableRef<IUser>>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetQuickFilterText = useCallback(
        _debounce((value: string) => setQuickFilterText(value), 1000),
        [setQuickFilterText],
    );

    return (
        <Grid container spacing={3}>
            <Grid item container xs={12} spacing={1}>
                <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                    <Grid item flex={1} />
                    <Grid item flex={1}>
                        <SearchInput
                            value={search}
                            onChange={(value) => {
                                setSearch(value);
                                debouncedSetQuickFilterText(value);
                            }}
                            placeholder={searchPlaceholder}
                            size="medium"
                            borderRadius="7px"
                            width="575px"
                            height="40px"
                        />
                    </Grid>
                    <Grid item container flex={1} justifyContent="flex-end">
                        <IconButton onClick={() => setIsCreateDialogOpen(true)}>
                            <AddCircle color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    {Boolean(categories) && (
                        <PermissionsTable
                            ref={permissionsTableRef}
                            permissionType={permissionType}
                            categories={Array.from(categories.values())}
                            onDeletePermissionsOfUser={(existingUser) => setDeleteDialogState({ isDialogOpen: true, user: existingUser })}
                            onEditPermissionsOfUser={(existingUser) => setEditDialogState({ isDialogOpen: true, user: existingUser })}
                            quickFilterText={quickFilterText}
                        />
                    )}
                </Grid>
            </Grid>
            <DeletePermissionsDialog
                isOpen={deleteDialogState.isDialogOpen}
                user={deleteDialogState.user}
                handleClose={() => setDeleteDialogState({ isDialogOpen: false, user: null })}
                onSuccess={() => permissionsTableRef.current?.refreshServerSide()}
            />
            <PermissionsDialog
                mode="create"
                permissionType={permissionType}
                isOpen={isCreateDialogOpen}
                handleClose={() => setIsCreateDialogOpen(false)}
                onSuccess={() => permissionsTableRef.current?.refreshServerSide()}
            />
            <PermissionsDialog
                mode="edit"
                permissionType={permissionType}
                isOpen={editDialogState.isDialogOpen}
                handleClose={() => setEditDialogState({ isDialogOpen: false, user: null })}
                existingUser={editDialogState.user || undefined}
                onSuccess={(user?: IUser) => permissionsTableRef.current?.updateRowDataClientSide(user as IUser)}
            />
        </Grid>
    );
};

export default ManagePermissionTab;
