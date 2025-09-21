import { Grid, IconButton } from '@mui/material';
import React from 'react';
import { IUser } from '../../interfaces/users';
import UserAvatar from '../UserAvatar';

interface ProfileButtonProps {
    currentUser: IUser;
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ currentUser, text, isDrawerOpen, onClick }) => {
    return (
        <Grid container direction="column" alignItems="center">
            <IconButton onClick={onClick} sx={{ borderRadius: 10 }}>
                <UserAvatar
                    userIcon={{ size: 48 }}
                    shouldRenderChip={false}
                    tooltip={{ title: text, disableHoverListener: isDrawerOpen, displayUserImage: false }} // when drawer is opened text is already shown, so no need for tooltip
                    user={currentUser}
                />
            </IconButton>
        </Grid>
    );
};

export { ProfileButton };
