import { useMatomo } from '@datapunt/matomo-tracker-react';
import { useTheme } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { IUser } from '@packages/user';
import React from 'react';
import { useDarkModeStore } from '../../stores/darkMode';
import { getNameInitials } from '../../utils/userProfile';

export interface UserIconProps {
    user: Partial<IUser>;
    size?: number;
    bgColor?: string;
    isDefaultProfile?: boolean;
    profileImage?: string;
    addBorder?: boolean;
    overrideSx?: object;
    isError?: boolean;
}

const UserIcon: React.FC<UserIconProps> = ({
    user,
    size = 48,
    bgColor,
    profileImage,
    overrideSx,
    isDefaultProfile = false,
    addBorder = false,
    isError = false,
}) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const { trackEvent } = useMatomo();

    const fontColor = !bgColor ? theme.palette.primary.main : darkMode ? 'black' : 'white';

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
            {(profileImage || !isDefaultProfile) && !isError ? (
                // biome-ignore lint/a11y/useAltText: image should be empty
                <img
                    src={profileImage}
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

export default UserIcon;
