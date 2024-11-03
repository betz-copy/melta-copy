import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useTheme } from '@mui/material';
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

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const queryClient = useQueryClient();

    const [displaySearchBar, setDisplaySearchBar] = useState<boolean>(false);
    const [searchedUser, setSearchedUser] = useState<IUser | null>(null);

    const { data: users, isLoading } = useQuery<IMongoUser[]>(['usersByWorkspaceId', workspace._id], () => searchUsersByPermissions(workspace._id), {
        enabled: !!workspace._id,
    });

    const { mutate: giveUserPermissionsToWorkspace } = useMutation({
        mutationFn: () =>
            createUserRequest(searchedUser!.externalMetadata.kartoffelId, searchedUser!.externalMetadata.digitalIdentitySource, {
                [workspace._id]: { admin: { scope: PermissionScope.write } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries(['usersByWorkspaceId', workspace._id]);
        },
        onError: () => {
            toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToCreatePermissionsOfUser'));
        },
    });

    return (
        <Dialog
            open={open}
            onClose={() => {
                setDisplaySearchBar(false);
                handleClose();
            }}
            fullWidth
            scroll="paper"
        >
            <DialogTitle>
                <BlueTitle
                    title={`${i18next.t('permissions.dialog.title')} ${
                        workspace.displayName ? workspace.displayName : i18next.t('permissions.dialog.mainWorkspaceTitle')
                    }`}
                    component="h4"
                    variant="h4"
                />
            </DialogTitle>
            <DialogContent
                sx={{
                    height: '50vh',
                    display: 'flex',
                    justifyContent: isLoading ? 'center' : 'start',
                    alignItems: 'center',
                    flexDirection: 'column',
                }}
            >
                {/* eslint-disable-next-line no-nested-ternary */}
                {isLoading ? (
                    <CircularProgress size={50} />
                ) : users?.length ? (
                    users?.map((user) => <PermissionsDialogCard key={user._id} user={user} workspaceId={workspace._id} />)
                ) : (
                    <BlueTitle title={i18next.t('relationshipTemplateAutocomplete.noOptions')} component="h6" variant="h6" />
                )}
            </DialogContent>
            <DialogActions sx={{ width: '100%', flexDirection: 'row-reverse', justifyContent: 'end' }}>
                {displaySearchBar ? (
                    <>
                        <IconButton>
                            <RemoveCircle
                                color="primary"
                                fontSize="large"
                                onClick={() => {
                                    setSearchedUser(null);
                                    setDisplaySearchBar(false);
                                }}
                            />
                        </IconButton>
                        <Box display="flex" flexDirection="row" width="100%">
                            <Box width="100%">
                                <UserAutocomplete
                                    mode="external"
                                    value={searchedUser}
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
                                    setDisplaySearchBar(false);
                                }}
                                disabled={!searchedUser}
                            >
                                {i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                            </Button>
                        </Box>
                    </>
                ) : (
                    <IconButton>
                        <AddCircle color="primary" fontSize="large" onClick={() => setDisplaySearchBar(true)} />
                    </IconButton>
                )}
            </DialogActions>
        </Dialog>
    );
};
