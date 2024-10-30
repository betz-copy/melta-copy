import { Box, Dialog, Divider, Grid, Paper, Typography, useTheme } from '@mui/material';
import React from 'react';
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

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    const currentUser = useUserStore((state) => state.user);
    const workspace: IWorkspace = useWorkspaceStore((state) => state.workspace);

    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    console.log('Workspace:', !!workspace);
    console.log('Workspace ID:', !!workspace?._id);

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

    console.log(users);

    return (
        <Dialog open={open} onClose={handleClose} fullWidth>
            <Grid container padding="16px">
                <Grid container>
                    <BlueTitle title={`הרשאות בסביבה ${workspace.displayName ? workspace.displayName : 'ראשית'}`} component="h4" variant="h4" />
                </Grid>
                <Grid container direction="column" sx={{ alignItems: 'stretch' }}>
                    {users?.map((user) => (
                        <Paper
                            className="user-info-card"
                            variant="outlined"
                            sx={{ borderRadius: '12px', margin: '5px 0',  transition: 'ease-out 0.2s', '&:hover': { backgroundColor: '#ebebeb' } }}
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
                    ))}
                </Grid>
            </Grid>
        </Dialog>
    );
};
