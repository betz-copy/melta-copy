import React, { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import { useQuery } from 'react-query';
import { IUser } from '../interfaces/users';
import { useDarkModeStore } from '../stores/darkMode';
import { getNameInitials } from '../utils/userProfile';
import { getUserProfileRequest } from '../services/userService';
import { environment } from '../globals';

interface UserAvatarProps {
    user: IUser;
    size?: number;
    bgColor?: string;
    defaultProfile?: boolean;
}

const { kartoffelProfile } = environment.users;

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor, defaultProfile = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#1E2775' : darkMode ? 'black' : 'white';

    const { data: profile, isError } = useQuery(
        ['userProfile', user.preferences.profilePath],
        async () => {
            const { profilePath } = user.preferences;
            if (!profilePath) return '';
            if (profilePath.startsWith('/icons/profileAvatar')) return profilePath;
            const img = new Image();
            img.src = await getUserProfileRequest(
                profilePath === kartoffelProfile ? { kartoffelId: user.externalMetadata.kartoffelId } : { profilePath },
            );
            return img as any;
        },
        {
            enabled: !defaultProfile,
            retry: false,
            onError: (error) => {
                console.error('Failed to fetch profile image:', error);
            },
        },
    );
    console.log({ profile });

    return (
        <Avatar
            sx={{
                height: size,
                width: size,
                backgroundColor: bgColor ?? '#fcfeff',
                color: fontColor,
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                maxWidth: '100%',
                font: `${Math.round(size / 2)}px Rubik`,
                fontSize: Math.round(size / 2),
                fontWeight: 500,
                border: '3px solid #FF006B',
            }}
        >
            {/* {profile && !isError ? ( */}
            <img
                src={profile ?? ''}
                // onLoad={(event) => {
                //     const img = event.target as HTMLImageElement;
                //     const aspectRatio = img.naturalWidth / img.naturalHeight;
                //     const containerHeight = window.innerHeight * 0.95;
                //     const containerWidth = containerHeight * aspectRatio;

                //     if (containerWidth > window.innerWidth) {
                //         img.style.width = '100%';
                //         img.style.height = 'auto';
                //     } else {
                //         img.style.height = '95vh';
                //         img.style.width = 'auto';
                //     }
                // }}
                // style={{ maxWidth: '100%', maxHeight: '95vh', transformOrigin: 'center center' }}
            />
            {/* ) : (
                getNameInitials(user)
            )} */}
        </Avatar>
    );
};

export default UserAvatar;
