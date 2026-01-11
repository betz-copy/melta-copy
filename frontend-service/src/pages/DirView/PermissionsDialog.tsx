import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import UserAutocomplete from '../../common/inputs/UserAutocomplete';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import { PermissionScope } from '../../interfaces/permissions';
import { IMongoUser, IUser } from '../../interfaces/users';
import { createUserRequest, searchUsersByPermissions } from '../../services/userService';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { PermissionsDialogCard } from './permissionsDialogCard';

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);

    const queryClient = useQueryClient();

    const [searchedUser, setSearchedUser] = useState<IUser | null>(null);

    const [addUserOpened, setAddUserOpened] = useState<boolean>(false);

    const [searchInput, setSearchInput] = useState('');
    const [searchText, setSearchText] = useState('');

    const usersQueryKey = ['usersByWorkspaceId', workspace._id, searchInput];

    const debouncedSetSearchInput = useCallback(
        debounce((value: string) => setSearchInput(value), 1000),
        [],
    );

    const { data: users = [], isLoading } = useQuery<IMongoUser[]>(usersQueryKey, () => searchUsersByPermissions(workspace._id, searchInput), {
        initialData: [] as IMongoUser[],
        enabled: !!workspace._id,
    });

    const { mutate: giveUserPermissionsToWorkspace } = useMutation({
        mutationFn: () =>
            createUserRequest(
                searchedUser!.kartoffelId,
                {
                    [workspace._id]: { admin: { scope: PermissionScope.write } },
                },
                workspace._id,
            ),
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
                <Grid container>
                    <Grid>
                        <BlueTitle
                            title={`${i18next.t('permissions.dialog.title')} ${
                                workspace.name === '' && workspace.path === '/'
                                    ? i18next.t('permissions.dialog.mainWorkspaceTitle')
                                    : workspace.displayName
                            }`}
                            component="h4"
                            variant="h4"
                        />
                    </Grid>
                    {hasPermissionsToModify() && (
                        <Grid container flex={1} justifyContent="flex-end">
                            <Button
                                variant="contained"
                                onClick={() => setAddUserOpened((prev) => !prev)}
                                disabled={addUserOpened}
                                sx={{ borderRadius: '7px' }}
                            >
                                <Typography fontSize="14px" fontWeight="500">
                                    {i18next.t('permissions.permissionsOfUserDialog.createTitle')}
                                </Typography>
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </DialogTitle>
            {addUserOpened && (
                <DialogActions sx={{ paddingX: '1.5rem' }}>
                    <Box display="flex" boxSizing="border-box" width="100%" paddingX="15px">
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
                            variant="contained"
                            onClick={() => {
                                giveUserPermissionsToWorkspace();
                                setSearchedUser(null);
                            }}
                            disabled={!searchedUser}
                            sx={{ marginLeft: '0.625rem' }}
                        >
                            {i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                        </Button>
                        <Button
                            color="primary"
                            variant="text"
                            onClick={() => {
                                setAddUserOpened(false);
                            }}
                            sx={{ marginLeft: '0.625rem' }}
                        >
                            {i18next.t('permissions.permissionsOfUserDialog.cancleBtn')}
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
                <Grid
                    container
                    flexDirection="column"
                    flexWrap="nowrap"
                    width="100%"
                    height="100%"
                    padding="15px"
                    border="1px solid rgba(0, 0, 0, 0.12)"
                    borderRadius="10px"
                >
                    <Grid width="100%" marginBottom="15px">
                        <TextField
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                debouncedSetSearchInput(e.target.value);
                            }}
                            sx={{ borderRadius: '7px', width: '100%' }}
                            label={i18next.t('permissions.searchUser')}
                            value={searchText}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment
                                            position="end"
                                            sx={{
                                                fontWeight: '400',
                                                letterSpacing: '0em',
                                                lineHeight: '16px',
                                                gap: '10px',
                                            }}
                                        >
                                            <img src="/icons/search-gray.svg" style={{ alignSelf: 'center', height: '18px' }} alt="Search" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    {isLoading ? (
                        <CircularProgress size={50} />
                    ) : users.length ? (
                        <Grid container flexDirection="column" height="100%" width="100%" flexWrap="nowrap" overflow="auto" padding="5px">
                            {users.map((user) => (
                                <Grid key={user._id}>
                                    <PermissionsDialogCard
                                        user={user}
                                        workspaceId={workspace._id}
                                        usersQueryKey={usersQueryKey}
                                        canModify={hasPermissionsToModify()}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <BlueTitle title={i18next.t('relationshipTemplateAutocomplete.noOptions')} component="h6" variant="h6" />
                    )}
                </Grid>
            </DialogContent>
        </Dialog>
    );
};
