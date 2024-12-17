import React from 'react';
import Avatar from '@mui/material/Avatar';
import { useQuery } from 'react-query';
import { IUser } from '../interfaces/users';
import { useDarkModeStore } from '../stores/darkMode';
import { getNameInitials } from '../utils/userProfile';
import { getUserProfileRequest } from '../services/userService';

interface UserAvatarProps {
    user: IUser;
    size?: number;
    bgColor?: string;
    defaultProfile?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 48, bgColor }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#1E2775' : darkMode ? 'black' : 'white';

    const { data: profile, isError } = useQuery(['userProfile', user.preferences.profilePath], async () => {
        const { profilePath } = user.preferences;
        if (!profilePath) return '';
        return getUserProfileRequest(user._id);
    });

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
                <img
                    src={profile}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            ) : (
                getNameInitials(user)
            )}
        </Avatar>
    );
};

export default UserAvatar;
