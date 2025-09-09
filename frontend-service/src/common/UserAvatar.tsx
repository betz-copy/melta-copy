import { useMatomo } from '@datapunt/matomo-tracker-react';
import Avatar from '@mui/material/Avatar';
import React from 'react';
import { useQuery } from 'react-query';
import { IUser } from '../interfaces/users';
import { getUserProfileRequest } from '../services/userService';
import { useDarkModeStore } from '../stores/darkMode';
import { getNameInitials } from '../utils/userProfile';

interface UserAvatarProps {
    user: Partial<IUser>;
    size?: number;
    bgColor?: string;
    isDefaultProfile?: boolean;
    userProfileImage?: string;
    addBorder?: boolean;
    overrideSx?: object;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    user,
    size = 48,
    bgColor,
    userProfileImage,
    overrideSx,
    isDefaultProfile = false,
    addBorder = false,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const { trackEvent } = useMatomo();

    // eslint-disable-next-line no-nested-ternary
    const fontColor = !bgColor ? '#1E2775' : darkMode ? 'black' : 'white';

    const { data: profile, isError } = useQuery(['userProfile', user?.preferences?.profilePath], async () => {
        return user?.preferences?.profilePath ? getUserProfileRequest(user) : '';
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
                border: addBorder ? '3px solid #FF006B' : null,
                ...overrideSx,
            }}
            onClick={() => {
                trackEvent({
                    category: 'side-bar',
                    action: 'profile avatar',
                });
            }}
        >
            {userProfileImage || (profile && !isError && !isDefaultProfile) ? (
                <img
                    src={userProfileImage ?? profile}
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
