import { Grid, IconButton } from '@mui/material';
import React from 'react';
import { IUser } from '../../interfaces/users';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
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
            <MeltaTooltip
                title={text}
                placement="left"
                disableHoverListener={isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
            >
                <IconButton onClick={onClick} sx={{ borderRadius: 10 }}>
                    <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                        <Grid data-tour="my-permissions">
                            <UserAvatar user={currentUser} addBorder />
                        </Grid>
                    </Grid>
                </IconButton>
            </MeltaTooltip>
        </Grid>
    );
};

export { ProfileButton };
