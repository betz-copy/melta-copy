import { Box, Button, Dialog, Divider, Grid, IconButton, Paper, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { IMongoUser, IUser } from '../../interfaces/users';
import { useQuery } from 'react-query';
import { IWorkspace } from '../../interfaces/workspaces';
import { searchUsersByPermissions } from '../../services/userService';
import { BlueTitle } from '../../common/BlueTitle';
import UserAvatar from '../../common/UserAvatar';
import randomColor from 'randomcolor';
import { useDarkModeStore } from '../../stores/darkMode';
import { getDateWithoutTime } from '../../utils/date';
import { ICompactPermissions } from '../../interfaces/permissions/permissions';
import i18next from 'i18next';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import UserAutocomplete from '../../common/inputs/UserAutocomplete';

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    const currentUser = useUserStore((state) => state.user);
    const workspace: IWorkspace = useWorkspaceStore((state) => state.workspace);

    const [displaySearchBar, setDisplaySearchBar] = useState<boolean>(false);
    const [searchedUser, setSearchedUser] = useState<IUser | null>(null);

    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { data: users, isLoading } = useQuery<IMongoUser[]>(['usersByWorkspaceId', workspace._id], () => searchUsersByPermissions(workspace._id), {
        enabled: !!workspace._id,
    });

    const getDateFormatted = (date: Date): string => {
        return getDateWithoutTime(date);
    };

    const getPermissionScope = (permissions: ICompactPermissions, workspaceId: string): string => {
        const scope = permissions[workspaceId].admin?.scope ?? permissions[workspaceId].permissions?.scope;
        return i18next.t(`permissions.scopes.${scope}`);
    };

    const getPermissionType = (permissions: ICompactPermissions, workspaceId: string): string => {
        const type = permissions[workspaceId].admin ? 'admin - ' : '';
        return type;
    };

    const giveUserPermissionsToWorkspace = (userId: string, workspaceId: string) => {
        // send the request to the server to give permissions
    };

    console.log(users);

    return (
        <Dialog open={open} onClose={handleClose} fullWidth>
            <Grid container padding="16px">
                <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
                    <BlueTitle title={`הרשאות בסביבה ${workspace.displayName ? workspace.displayName : 'ראשית'}`} component="h4" variant="h4" />
                </Box>
                <Box display="flex" flexDirection="column" width="100%" marginTop="5px">
                    {users?.length ? (
                        users?.map((user) => (
                            <Paper
                                className="user-info-card"
                                variant="outlined"
                                sx={{ borderRadius: '12px', margin: '5px 0', transition: 'ease-out 0.2s', '&:hover': { backgroundColor: '#ebebeb' } }}
                            >
                                <Box display="flex" flexDirection="row" alignItems="center" gap="10px">
                                    <Box className="user-info" display="flex" alignItems="center">
                                        <Box padding="10px" className="profile-photo">
                                            <UserAvatar user={user} size={50} bgColor={randomColor({ luminosity: 'dark', seed: user!._id })} />
                                        </Box>
                                        <Box className="display-name" padding="0px">
                                            <Box display="flex" flexDirection="column">
                                                <Typography color={darkMode ? 'white' : 'black'} fontSize="16px" fontWeight="500">
                                                    {user.fullName}
                                                </Typography>
                                                <Typography color={darkMode ? 'white' : 'black'} fontFamily="Rubik" fontSize="14px" fontWeight="400">
                                                    {user.hierarchy}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Divider orientation="vertical" variant="middle" flexItem />
                                    <Box className="permission-scope-updated-date">
                                        <Box>
                                            <Typography fontSize="16px" fontWeight="500">
                                                {`סוג הרשאה: ${getPermissionType(user.permissions, workspace._id)} ${getPermissionScope(
                                                    user.permissions,
                                                    workspace._id,
                                                )}`}
                                            </Typography>
                                        </Box>
                                        <Typography fontSize="14px" fontWeight="400">
                                            עודכן ב: {getDateFormatted(user.updatedAt)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        ))
                    ) : (
                        <BlueTitle title="אין תוצאות" component="h6" variant="h6" />
                    )}
                </Box>
                <Box display="flex" flexDirection="row-reverse" width="100%" justifyContent="end" alignItems="center">
                    {!displaySearchBar && (
                        <IconButton>
                            <AddCircle color="primary" fontSize="large" onClick={() => setDisplaySearchBar(!displaySearchBar)} />
                        </IconButton>
                    )}
                    {displaySearchBar && (
                        <>
                            <IconButton>
                                <RemoveCircle color="primary" fontSize="large" onClick={() => setDisplaySearchBar(!displaySearchBar)} />
                            </IconButton>
                            <Box display="flex" flexDirection="row" width="100%" sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
                                <Box width="100%">
                                    <UserAutocomplete
                                        mode={'external'}
                                        value={searchedUser}
                                        onChange={(_e, chosenUser) => setSearchedUser(chosenUser)}
                                        isError={false}
                                    />
                                </Box>
                                <Button
                                    color="primary"
                                    variant="text"
                                    onClick={() => searchedUser && giveUserPermissionsToWorkspace(searchedUser?._id, workspace._id)}
                                >
                                    {i18next.t(`permissions.permissionsOfUserDialog.createBtn`)}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Grid>
        </Dialog>
    );
};
