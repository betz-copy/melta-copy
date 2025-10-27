import { Delete } from '@mui/icons-material';
import { Divider, Grid, IconButton, Paper, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import UserAvatar from '../../common/UserAvatar';
import { ICompactPermissions } from '../../interfaces/permissions/permissions';
import { IMongoUser, RelatedPermission } from '../../interfaces/users';
import { syncPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { getDateWithoutTime } from '../../utils/date';

interface IPermissionsDialogCardProps {
    user: IMongoUser;
    workspaceId: string;
    usersQueryKey: string[];
    canModify: boolean;
}

export const PermissionsDialogCard: React.FC<IPermissionsDialogCardProps> = ({ user, workspaceId, usersQueryKey, canModify }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [hover, setHover] = useState<boolean>(false);

    const getPermissionScope = (permissions: ICompactPermissions): string => {
        return i18next.t(`permissions.scopes.${permissions[workspaceId].admin?.scope ?? permissions[workspaceId].permissions?.scope}`);
    };

    const getPermissionType = (permissions: ICompactPermissions): string => {
        return permissions[workspaceId].admin ? 'admin - ' : '';
    };

    const queryClient = useQueryClient();

    const { mutate: handlePermissionsDelete } = useMutation({
        mutationFn: () => syncPermissionsRequest(user._id, RelatedPermission.User, { [workspaceId]: { admin: null } }),
        onSuccess: () => {
            queryClient.invalidateQueries(usersQueryKey);
        },
        onError: () => {
            toast.error(i18next.t('permissions.failedToDeleteUser'));
        },
    });

    return (
        <Paper
            id="user-info-card"
            variant="outlined"
            sx={{
                borderRadius: '10px',
                borderColor: 'primary',
                marginY: '0.3rem',
                width: '100%',
                transition: 'ease-out 0.2s',
                '&:hover': { backgroundColor: darkMode ? '#242424' : '#ebebeb' },
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <Grid container alignItems="center" gap="0.8rem" flexWrap="nowrap">
                <Grid container id="user-info" alignItems="center" width="35%" flexWrap="nowrap">
                    <Grid padding="10px" id="profile-photo">
                        <UserAvatar
                            user={{ ...user, _id: user.kartoffelId }} // When UserAvatar requests kartoffelImage it does it by _id of user
                            userIcon={{ size: 50 }}
                            shouldRenderChip={false}
                            shouldRenderTooltip={false}
                            shouldGetKartoffelImage
                        />
                    </Grid>
                    <Grid container id="display-name" flexDirection="column" overflow="hidden" width="100px">
                        <Grid>
                            <Typography fontSize="16px" fontWeight="500">
                                {user.fullName}
                            </Typography>
                        </Grid>
                        <Grid width="100%">
                            <MeltaTooltip title={user.hierarchy} placement="bottom">
                                <Typography
                                    fontFamily="Rubik"
                                    fontSize="14px"
                                    fontWeight="400"
                                    textOverflow="ellipsis"
                                    whiteSpace="nowrap"
                                    overflow="hidden"
                                >
                                    {user.hierarchy}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid width="5px" height="50px">
                    <Divider orientation="vertical" />
                </Grid>

                <Grid width="40%" id="permission-scope-updated-date" marginRight="1.8rem">
                    <Typography fontSize="16px" fontWeight="500" whiteSpace="nowrap">
                        {i18next.t('permissions.dialog.permissionType')}: {getPermissionType(user.permissions)} {getPermissionScope(user.permissions)}
                    </Typography>

                    <Typography fontSize="14px" fontWeight="400">
                        {i18next.t('permissions.dialog.updatedAt')}: {getDateWithoutTime(user.updatedAt)}
                    </Typography>
                </Grid>

                <Grid container width="20%" alignItems="center" justifyContent="space-evenly">
                    {hover && canModify && (
                        <>
                            <Grid width="5px" height="50px">
                                <Divider orientation="vertical" />
                            </Grid>
                            <Grid>
                                <IconButton>
                                    <Delete color="primary" fontSize="medium" onClick={() => handlePermissionsDelete()} />
                                </IconButton>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
};
