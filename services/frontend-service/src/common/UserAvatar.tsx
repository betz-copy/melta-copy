import React from 'react';
import Avatar from '@mui/material/Avatar';
import { IUser } from '@microservices/shared-interfaces';
import { useDarkModeStore } from '../stores/darkMode';

interface UserAvatarProps {
    user: IUser;
    size?: number;
    bgColor?: string;
}

const getNameInitials = (user: IUser): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#1E2775' : darkMode ? 'black' : 'white';

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
            }}
        >
            {getNameInitials(user)}
        </Avatar>
    );
};

export default UserAvatar;
