import React from 'react';
import Avatar from '@mui/material/Avatar';
import { useQuery } from 'react-query';
import { IUser } from '../interfaces/users';
import { useDarkModeStore } from '../stores/darkMode';
import { apiUrlToProfileImageSource } from '../services/storageService';
import { environment } from '../globals';
import { getNameInitials } from '../utils/userProfile';

interface UserAvatarProps {
    user: IUser;
    size?: number;
    bgColor?: string;
    kartoffelProfile?: string;
    defaultProfile?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor, kartoffelProfile, defaultProfile = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#1E2775' : darkMode ? 'black' : 'white';

    const { data: profile, isError } = useQuery(
        ['userProfile', user.preferences.profilePath],
        async () => {
            const { profilePath } = user.preferences;
            if (!profilePath) return null;
            if (profilePath === 'kartoffelProfile') return kartoffelProfile;
            if (profilePath.startsWith('/icons/profileAvatar')) return profilePath;
            return apiUrlToProfileImageSource(`/api${environment.api.storage}/user-profile/${user.preferences.profilePath}`);
        },
        {
            enabled: !defaultProfile,
            retry: false,
            onError: (error) => {
                console.error('Failed to fetch profile image:', error);
            },
        },
    );

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
            {profile && !isError ? (
                <div
                    style={{
                        backgroundImage: `url(${profile})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        height: '100%',
                        width: '100%',
                    }}
                />
            ) : (
                getNameInitials(user)
            )}
        </Avatar>
    );
};

export default UserAvatar;
