import { AddCircle } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import _debounce from 'lodash.debounce';
import PermissionsDialog from '../../../common/PermissionsDialog';
import '../../../css/pages.css';
import { ICategoryMap } from '../../../interfaces/categories';
import { IUser, PermissionData, RelatedPermission } from '../../../interfaces/users';
import { IRole } from '../../../interfaces/roles';
import DeletePermissionsDialog from './deleteDialog';
import SearchInput from '../../../common/inputs/SearchInput';
import PermissionsTable, { PermissionsTableRef } from './table';

const ManagePermissionTab: React.FC<{ permissionType: RelatedPermission; searchPlaceholder: string }> = ({ permissionType, searchPlaceholder }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);

    const [deleteDialogState, setDeleteDialogState] = useState<{
        isDialogOpen: boolean;
        relatedId: string | null;
    }>({
        isDialogOpen: false,
        relatedId: null,
    });

    const [editDialogState, setEditDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
        role: IRole | null;
    }>({
        isDialogOpen: false,
        user: null,
        role: null,
    });

    const [quickFilterText, setQuickFilterText] = useState('');

    const [search, setSearch] = useState('');

    const permissionsTableRef = useRef<PermissionsTableRef<PermissionData>>(null);

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
                            onDeletePermissions={({ _id }) => setDeleteDialogState({ isDialogOpen: true, relatedId: _id })}
                            onEditPermissions={(roleOrUser) =>
                                setEditDialogState({
                                    isDialogOpen: true,
                                    user: permissionType === RelatedPermission.User ? (roleOrUser as IUser) : null,
                                    role: permissionType === RelatedPermission.Role ? (roleOrUser as IRole) : null,
                                })
                            }
                            quickFilterText={quickFilterText}
                            getRowId={({ _id }) => _id}
                        />
                    )}
                </Grid>
            </Grid>
            <DeletePermissionsDialog
                isOpen={deleteDialogState.isDialogOpen}
                relatedId={deleteDialogState.relatedId}
                permissionType={permissionType}
                handleClose={() => setDeleteDialogState({ isDialogOpen: false, relatedId: null })}
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
                handleClose={() => setEditDialogState({ isDialogOpen: false, user: null, role: null })}
                roleOrUser={editDialogState.user || editDialogState.role || undefined}
                onSuccess={(roleOrUser?: PermissionData) => permissionsTableRef.current?.updateRowDataClientSide(roleOrUser!)}
            />
        </Grid>
    );
};

export default ManagePermissionTab;
