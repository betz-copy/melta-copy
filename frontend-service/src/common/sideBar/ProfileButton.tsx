import { Grid, IconButton, Tooltip, tooltipClasses, Typography } from '@mui/material';
import React from 'react';
import { IUser } from '../../services/kartoffelService';
import UserAvatar from '../UserAvatar';

interface ProfileButtonProps {
    currentUser: IUser;
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const getNameInitials = (user: ProfileButtonProps['currentUser']): string => {
    if (user.firstName && user.lastName) {
        return user.firstName.charAt(0) + user.lastName.charAt(0);
    }
    if (user.fullName) {
        const names = user.fullName.split(' ');
        return names.map((name) => name.charAt(0)).join('');
    }
    return '';
};

const ProfileButton: React.FC<ProfileButtonProps> = ({ currentUser, text, isDrawerOpen, onClick }) => {
    return (
        <Grid container direction="column" alignItems="center">
            <Tooltip
                title={text}
                arrow
                placement="left"
                disableHoverListener={isDrawerOpen}
                PopperProps={{
                    sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem' } },
                }}
            >
                <IconButton onClick={onClick} sx={{ borderRadius: 10 }}>
                    <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                        <Grid item data-tour="my-permissions">
                            <UserAvatar user={currentUser} />
                        </Grid>
                        {isDrawerOpen && (
                            <Grid item>
                                <Typography color="white">{text}</Typography>
                            </Grid>
                        )}
                    </Grid>
                </IconButton>
            </Tooltip>
        </Grid>
    );
};

export { ProfileButton };
