import { Grid, IconButton } from '@mui/material';
import React from 'react';
import { IUser } from '../../services/kartoffelService';
import UserAvatar from '../UserAvatar';
import { MeltaTooltip } from '../MeltaTooltip';

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
            <MeltaTooltip
                title={text}
                placement="left"
                disableHoverListener={isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
            >
                <IconButton onClick={onClick} sx={{ borderRadius: 10 }}>
                    <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                        <Grid item data-tour="my-permissions">
                            <UserAvatar user={currentUser} />
                        </Grid>
                    </Grid>
                </IconButton>
            </MeltaTooltip>
        </Grid>
    );
};

export { ProfileButton };
