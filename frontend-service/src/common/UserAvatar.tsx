import React, { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material';
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

export const getNameInitials = (user: IUser): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor, defaultProfile = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? theme.palette.primary.main : darkMode ? 'black' : 'white';
    const [profile, setProfile] = useState<string>();

    useEffect(() => {
        if (!defaultProfile) {
            const getUserProfile = async () => {
                if (!isProfileFileType(user.preferences.profilePath)) {
                    setProfile(user.preferences.profilePath);
                } else {
                    const icon = new Image();
                    icon.src = await apiUrlToImageSource(`/api${environment.api.storage}/${user.preferences.profilePath}`, 'users-global-bucket');
                    console.log({ icon }, icon.src);
                    setProfile(icon.src);
                }
                // if (user.preferences.profilePath) {
                //     if (user.preferences.profilePath.startsWith('/icons/profileAvatar') || user.preferences.profilePath.startsWith('http://')) {
                //         setProfile(user.preferences.profilePath);
                //     } else {
                //         const icon = new Image();
                //         icon.src = await apiUrlToImageSource(`/api${environment.api.storage}/${user.preferences.profilePath}`, 'users-global-bucket');
                //         console.log({ icon }, icon.src);

                //         setProfile(icon.src);
                //     }
                // }
            };
            getUserProfile();
        }
    }, []);

    return (
        <Avatar
            sx={{
                height: size,
                width: size,
                maxWidth: '100%',
                padding: '0.5rem',
                font: `${Math.round(size / 2)}px Rubik`,
                fontSize: Math.round(size / 2),
                backgroundColor: bgColor ?? '#fcfeff',
                fontWeight: 500,
                color: fontColor,
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.5)',
            }}
            src={profile}
        >
            {getNameInitials(user)}
        </Avatar>
    );
};

export default UserAvatar;
