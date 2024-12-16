import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { BlueTitle } from '../../common/BlueTitle';
import UserAutocomplete from '../../common/inputs/UserAutocomplete';
import { PermissionScope } from '../../interfaces/permissions';
import { IMongoUser, IUser } from '../../interfaces/users';
import { createUserRequest, searchUsersByPermissions } from '../../services/userService';
import { useWorkspaceStore } from '../../stores/workspace';
import { PermissionsDialogCard } from './permissionsDialogCard';
import { useUserStore } from '../../stores/user';

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);

    const queryClient = useQueryClient();

    const [searchedUser, setSearchedUser] = useState<IUser | null>(null);

    const usersQueryKey = ['usersByWorkspaceId', workspace._id];

    const { data: users = [], isLoading } = useQuery<IMongoUser[]>(usersQueryKey, () => searchUsersByPermissions(workspace._id), {
        initialData: [] as IMongoUser[],
        enabled: !!workspace._id,
    });

    const { mutate: giveUserPermissionsToWorkspace } = useMutation({
        mutationFn: () =>
            createUserRequest(searchedUser!.externalMetadata.kartoffelId, searchedUser!.externalMetadata.digitalIdentitySource, {
                [workspace._id]: { admin: { scope: PermissionScope.write } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries(usersQueryKey);
        },
        onError: () => {
            toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToCreatePermissionsOfUser'));
        },
    });

    const hasPermissionsToModify = (): boolean => {
        const hierarchyIds = queryClient.getQueryData<string[]>(['getWorkspaceHierarchyIds', workspace._id])!;
        return !!currentUser.permissions[hierarchyIds[hierarchyIds.length - 2]];
    };

    return (
        <Dialog
            open={open}
            onClose={() => {
                handleClose();
            }}
            fullWidth
            scroll="paper"
        >
            <DialogTitle>
                <BlueTitle
                    title={`${i18next.t('permissions.dialog.title')} ${
                        workspace.name === '' && workspace.path === '/' ? i18next.t('permissions.dialog.mainWorkspaceTitle') : workspace.displayName
                    }`}
                    component="h4"
                    variant="h4"
                />
            </DialogTitle>
            {hasPermissionsToModify() && (
                <DialogActions sx={{ paddingX: '1.5rem' }}>
                    <Box display="flex" boxSizing="border-box" width="100%">
                        <Box width="100%">
                            <UserAutocomplete
                                mode="external"
                                value={searchedUser}
                                label={i18next.t('userAutocomplete.searchLabel')}
                                onChange={(_e, chosenUser) => setSearchedUser(chosenUser)}
                                isError={false}
                            />
                        </Box>
                        <Button
                            color="primary"
                            variant="text"
                            onClick={() => {
                                giveUserPermissionsToWorkspace();
                                setSearchedUser(null);
                            }}
                            disabled={!searchedUser}
                            sx={{ marginLeft: '0.625rem' }}
                        >
                            {i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                        </Button>
                    </Box>
                </DialogActions>
            )}
            <DialogContent
                sx={{
                    height: '50vh',
                    display: 'flex',
                    justifyContent: isLoading ? 'center' : 'start',
                    alignItems: 'center',
                    flexDirection: 'column',
                    marginY: '0.5rem',
                }}
            >
                {/* eslint-disable-next-line no-nested-ternary */}
                {isLoading ? (
                    <CircularProgress size={50} />
                ) : users.length ? (
                    users.map((user) => (
                        <PermissionsDialogCard
                            key={user._id}
                            user={user}
                            workspaceId={workspace._id}
                            usersQueryKey={usersQueryKey}
                            canModify={hasPermissionsToModify()}
                        />
                    ))
                ) : (
                    <BlueTitle title={i18next.t('relationshipTemplateAutocomplete.noOptions')} component="h6" variant="h6" />
                )}
            </DialogContent>
        </Dialog>
    );
};
