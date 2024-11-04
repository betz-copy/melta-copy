import { Delete } from '@mui/icons-material';
import { Box, Divider, IconButton, Paper, Typography } from '@mui/material';
import i18next from 'i18next';
import randomColor from 'randomcolor';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import UserAvatar from '../../common/UserAvatar';
import { ICompactPermissions } from '../../interfaces/permissions/permissions';
import { IMongoUser } from '../../interfaces/users';
import { syncUserPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { getDateWithoutTime } from '../../utils/date';

interface IPermissionsDialogCardProps {
    user: IMongoUser;
    workspaceId: string;
}

export const PermissionsDialogCard: React.FC<IPermissionsDialogCardProps> = ({ user, workspaceId }) => {
    const currentUser = useUserStore((state) => state.user);
    const workspace = useWorkspaceStore((state) => state.workspace);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [hover, setHover] = useState<Boolean>(false);

    const getPermissionScope = (permissions: ICompactPermissions): string => {
        return i18next.t(`permissions.scopes.${permissions[workspaceId].admin?.scope ?? permissions[workspaceId].permissions?.scope}`);
    };

    const getPermissionType = (permissions: ICompactPermissions): string => {
        return permissions[workspaceId].admin ? 'admin - ' : '';
    };

    const queryClient = useQueryClient();

    const { mutate: handlePermissionsDelete } = useMutation({
        mutationFn: () => syncUserPermissionsRequest(user._id, { [workspaceId]: { admin: null } }),
        onSuccess: () => {
            queryClient.invalidateQueries(['usersByWorkspaceId', workspaceId]);
        },
        onError: () => {
            toast.error(i18next.t('permissions.failedToDeleteUser'));
        },
    });

    const hasPermissionsToDelete = (): boolean => {
        const hierarchyIds = queryClient.getQueryData<string[]>(['getWorkspaceHierarchyIds', workspace._id])!;
        return !!currentUser.permissions[hierarchyIds[hierarchyIds.length - 2]];
    };

    return (
        <Paper
            id="user-info-card"
            variant="outlined"
            sx={{
                borderRadius: '10px',
                borderColor: 'primary',
                margin: '5px 0',
                width: '100%',
                transition: 'ease-out 0.2s',
                '&:hover': { backgroundColor: darkMode ? '#242424' : '#ebebeb' },
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <Box display="flex" alignItems="center" justifyContent="start" gap="0.8rem">
                <Box id="user-info" display="flex" alignItems="center" width="40%">
                    <Box padding="10px" id="profile-photo">
                        <UserAvatar user={user} size={50} bgColor={randomColor({ luminosity: 'dark', seed: user!._id })} />
                    </Box>
                    <Box id="display-name" display="flex" flexDirection="column" overflow="hidden">
                        <Typography fontSize="16px" fontWeight="500">
                            {user.fullName}
                        </Typography>
                        <Box boxSizing="border-box" width="100%">
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
                        </Box>
                    </Box>
                </Box>

                <Divider orientation="vertical" variant="middle" flexItem />

                <Box id="permission-scope-updated-date" marginRight="1.8rem">
                    <Typography fontSize="16px" fontWeight="500" whiteSpace="nowrap">
                        {i18next.t('permissions.dialog.permissionType')}: {getPermissionType(user.permissions)} {getPermissionScope(user.permissions)}
                    </Typography>

                    <Typography fontSize="14px" fontWeight="400">
                        {i18next.t('permissions.dialog.updatedAt')}: {getDateWithoutTime(user.updatedAt)}
                    </Typography>
                </Box>

                {hover && hasPermissionsToDelete() && (
                    <>
                        <Divider orientation="vertical" variant="middle" flexItem />
                        <IconButton>
                            <Delete color="primary" fontSize="medium" onClick={() => handlePermissionsDelete()} />
                        </IconButton>
                    </>
                )}
            </Box>
        </Paper>
    );
};
