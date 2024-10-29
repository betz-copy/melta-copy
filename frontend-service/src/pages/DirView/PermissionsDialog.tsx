import { Dialog, Grid, Paper, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { IUser } from '../../interfaces/users';
import { useQuery } from 'react-query';
import { IWorkspace } from '../../interfaces/workspaces';
import { searchUsersByPermissions } from '../../services/userService';
import { BlueTitle } from '../../common/BlueTitle';
import UserAvatar from '../../common/UserAvatar';
import randomColor from 'randomcolor';
import { useDarkModeStore } from '../../stores/darkMode';

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

    const { data: users, isLoading } = useQuery<IUser[]>(['usersByWorkspaceId', workspace._id], () => searchUsersByPermissions(workspace._id), {
        enabled: !!workspace._id,
    });

    console.log(users);

    return (
        <Dialog open={open} onClose={handleClose} fullWidth>
            <Grid container padding="16px">
                <Grid container>
                    <BlueTitle title={`הרשאות בסביבה ${workspace.displayName ? workspace.displayName : 'ראשית'}`} component="h4" variant="h4" />
                </Grid>
                <Grid container direction="column" sx={{ alignItems: 'stretch' }}>
                    {users?.map((user) => (
                        <Paper className="user-info-card" variant="outlined" sx={{ borderRadius: '12px', margin: '5px' }}>
                            <Grid container>
                                <Grid container alignItems="center" className="user-info">
                                    <Grid item padding="10px" className="profile-photo">
                                        <UserAvatar user={user} size={50} bgColor={randomColor({ luminosity: 'dark', seed: user!._id })} />
                                    </Grid>
                                    <Grid item className="display-name">
                                        <Grid item direction="column">
                                            <Typography
                                                variant="subtitle1"
                                                color={darkMode ? 'white' : 'black'}
                                                fontFamily="Rubik"
                                                fontSize="16px"
                                                fontWeight="500"
                                            >
                                                {user.fullName}
                                            </Typography>
                                            <Typography
                                                variant="subtitle1"
                                                color={darkMode ? 'lightgray' : 'gray'}
                                                fontFamily="Rubik"
                                                fontSize="14px"
                                                fontWeight="400"
                                            >
                                                {user.hierarchy}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Typography>
                                    {user.permissions[workspace._id].admin?.scope ?? user.permissions[workspace._id].permissions?.scope}
                                </Typography>
                            </Grid>
                        </Paper>
                    ))}
                </Grid>
            </Grid>
        </Dialog>
    );
};
