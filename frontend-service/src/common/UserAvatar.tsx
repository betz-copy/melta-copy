import React, { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import { IUser } from '../interfaces/users';
import { useDarkModeStore } from '../stores/darkMode';
import { apiUrlToImageSource } from '../services/storageService';
import { environment } from '../globals';
import { isProfileFileType } from './permissionsOfUserDialog/myAccount';

interface UserAvatarProps {
    user: IUser;
    size?: number;
    bgColor?: string;
    defaultProfile?: boolean;
}

const getNameInitials = (user: IUser): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor, defaultProfile = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#1E2775' : darkMode ? 'black' : 'white';
    const [profile, setProfile] = useState<string>();

    useEffect(() => {
        if (!defaultProfile) {
            const getUserProfile = async () => {
                if (!isProfileFileType(user.preferences.profilePath)) {
                    setProfile(user.preferences.profilePath);
                } else {
                    const icon = new Image();
                    icon.src = await apiUrlToImageSource(`/api${environment.api.storage}/${user.preferences.profilePath}`, 'users-global-bucket');
                    setProfile(icon.src);
                }
            };
            getUserProfile();
        }
    }, [defaultProfile, user.preferences.profilePath]);

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
            {profile ? (
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
