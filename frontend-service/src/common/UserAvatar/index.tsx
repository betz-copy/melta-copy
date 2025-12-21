import { Box, Chip, ChipProps, Grid, TooltipProps, Typography } from '@mui/material';
import { IUser } from '@packages/user';
import React from 'react';
import { useQueries } from 'react-query';
import { getKartoffelUserProfileRequest, getUserProfileRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import UserIcon, { UserIconProps } from './UserIcon';

export interface IUserAvatarProps {
    user: Partial<IUser>;
    tooltip?: (Omit<TooltipProps, 'children' | 'title'> & { displayUserImage?: boolean; title?: TooltipProps['title'] }) | undefined;
    chip?: ChipProps;
    userIcon?: Omit<UserIconProps, 'user'>;
    shouldRenderChip?: boolean;
    shouldRenderTooltip?: boolean;
    shouldGetKartoffelImage?: boolean;
}

const UserAvatar: React.FC<IUserAvatarProps> = ({
    user,
    chip,
    tooltip,
    userIcon,
    shouldRenderChip = true,
    shouldRenderTooltip = true,
    shouldGetKartoffelImage = !user.preferences,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [{ data: meltaUserProfile, isError: isErrorMelta }, { data: kartoffelUser, isError: isErrorKartoffel }] = useQueries([
        {
            queryKey: ['userProfile', user._id, user?.preferences, userIcon],
            queryFn: () => getUserProfileRequest(user),
            enabled: !shouldGetKartoffelImage && !userIcon?.isDefaultProfile,
            retry: 1,
        },
        {
            queryKey: ['kartoffelImage', user.kartoffelId, user._id],
            // KartoffelId will usually be undefined since the users saved in neo4j will have _id (which is their kartoffelId)
            queryFn: () => getKartoffelUserProfileRequest(user.kartoffelId ?? user._id!),
            enabled: shouldGetKartoffelImage && !userIcon?.isDefaultProfile,
            retry: 1,
        },
    ]);

    const profileImage = meltaUserProfile ?? kartoffelUser;

    const hasMeltaError = user.preferences && isErrorMelta;
    const hasKartoffelError = !user.preferences && isErrorKartoffel;
    const defaultUserIcon = {
        overrideSx: { border: '1.3px solid #FF006B' },
        size: 25,
        user,
        isError: hasMeltaError || hasKartoffelError,
        ...userIcon,
        profileImage: userIcon?.profileImage ?? profileImage,
    };

    const avatar = <UserIcon {...defaultUserIcon} />;

    const content = shouldRenderChip ? (
        <Chip
            label={user.fullName}
            sx={{ background: darkMode ? '#1E1F2B' : '#EBEFFA', color: darkMode ? '#D3D6E0' : '#53566E' }}
            avatar={avatar}
            {...chip}
        />
    ) : (
        avatar
    );

    return shouldRenderTooltip ? (
        <MeltaTooltip
            {...tooltip}
            title={
                <Box display="flex" alignItems="center" gap={1}>
                    {(tooltip?.displayUserImage ?? true) && <UserIcon {...defaultUserIcon} size={48} />}
                    {tooltip?.title || <Typography variant="body2">{user.fullName}</Typography>}
                </Box>
            }
        >
            <Grid>{content}</Grid>
        </MeltaTooltip>
    ) : (
        content
    );
};

export default UserAvatar;
