import React from 'react';
import Avatar from '@mui/material/Avatar';
import { useSelector } from 'react-redux';
import { IUser } from '../services/kartoffelService';
import { RootState } from '../store';

interface UserAvatarProps {
    user: IUser;
    size?: number;
    bgColor?: string;
}

const getNameInitials = (user: IUser): string => {
    if (user.firstName && user.lastName) {
        return user.firstName.charAt(0) + user.lastName.charAt(0);
    }
    if (user.fullName) {
        const names = user.fullName.split(' ');
        return names.map((name) => name.charAt(0)).join('');
    }
    return '';
};

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#225AA7' : darkMode ? 'black' : 'white';

    return (
        <Avatar
            sx={{
                borderRadius: 10,
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
