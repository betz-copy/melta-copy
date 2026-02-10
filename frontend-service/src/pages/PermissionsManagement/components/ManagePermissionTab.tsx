import { AddCircle } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import { debounce } from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import SearchInput from '../../../common/inputs/SearchInput';
import PermissionsDialog from '../../../common/PermissionsDialog';
import '../../../css/pages.css';
import { PermissionData } from '@packages/permission';
import { IRole } from '@packages/role';
import { IUser, IUserPopulated, RelatedPermission } from '@packages/user';
import { PermissionDialogMode } from '../../../interfaces/inputs';
import { ICategoryMap } from '../../../interfaces/template';
import DeletePermissionsDialog from './deleteDialog';
import PermissionsTable, { PermissionsTableRef } from './table';

const ManagePermissionTab: React.FC<{ permissionType: RelatedPermission; searchPlaceholder: string }> = ({ permissionType, searchPlaceholder }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);

    const [deleteDialogState, setDeleteDialogState] = useState<{
        isDialogOpen: boolean;
        roleOrUser: PermissionData | null;
    }>({
        isDialogOpen: false,
        roleOrUser: null,
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

    const debouncedSetQuickFilterText = useCallback(
        debounce((value: string) => setQuickFilterText(value), 1000),
        [],
    );

    return (
        <Grid container spacing={3}>
            <Grid container size={{ xs: 12 }} spacing={1}>
                <Grid size={{ xs: 12 }} container justifyContent="space-between" alignItems="center">
                    <Grid flex={1} />
                    <Grid flex={1}>
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
                    <Grid container flex={1} justifyContent="flex-end">
                        <IconButton onClick={() => setIsCreateDialogOpen(true)}>
                            <AddCircle color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    {Boolean(categories) && (
                        <PermissionsTable
                            ref={permissionsTableRef}
                            permissionType={permissionType}
                            categories={Array.from(categories.values())}
                            onDeletePermissions={(roleOrUser) => setDeleteDialogState({ isDialogOpen: true, roleOrUser })}
                            onEditPermissions={(roleOrUser) => {
                                const { roles, ...restOfUser } = roleOrUser as IUserPopulated;
                                const roleIds = roles?.map((role) => role._id);

                                setEditDialogState({
                                    isDialogOpen: true,
                                    user: permissionType === RelatedPermission.User ? ({ roleIds, ...restOfUser } as IUser) : null,
                                    role: permissionType === RelatedPermission.Role ? (roleOrUser as IRole) : null,
                                });
                            }}
                            quickFilterText={quickFilterText}
                            getRowId={({ _id }) => _id}
                        />
                    )}
                </Grid>
            </Grid>
            <DeletePermissionsDialog
                isOpen={deleteDialogState.isDialogOpen}
                roleOrUser={deleteDialogState.roleOrUser}
                permissionType={permissionType}
                handleClose={() => setDeleteDialogState({ isDialogOpen: false, roleOrUser: null })}
                onSuccess={() => permissionsTableRef.current?.refreshServerSide()}
            />
            <PermissionsDialog
                mode={PermissionDialogMode.Create}
                permissionType={permissionType}
                isOpen={isCreateDialogOpen}
                handleClose={() => setIsCreateDialogOpen(false)}
                onSuccess={() => permissionsTableRef.current?.refreshServerSide()}
            />
            <PermissionsDialog
                mode={PermissionDialogMode.Edit}
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
