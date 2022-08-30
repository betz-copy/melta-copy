import { Avatar, Grid, IconButton, Tooltip, tooltipClasses, Typography } from '@mui/material';
import React from 'react';
import { UserState } from '../../store/user';

interface ProfileButtonProps {
    currentUser: Partial<UserState>;
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

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
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Avatar
                                sx={{
                                    borderRadius: 10,
                                    height: 48,
                                    width: 48,
                                    maxWidth: '100%',
                                    padding: '0.5rem',
                                    font: '28px Rubik',
                                    fontSize: 25,
                                    backgroundColor: '#fcfeff',
                                    fontWeight: 500,
                                    color: '#225AA7',
                                    '&:hover': { backgroundColor: isDrawerOpen ? undefined : '#dfe4e7' },
                                }}
                            >
                                {currentUser.name?.firstName.charAt(0)}
                                {currentUser.name?.lastName.charAt(0)}
                            </Avatar>
                        </Grid>
                        {isDrawerOpen && (
                            <Grid item>
                                <Typography color="white" visibility={isDrawerOpen ? 'visible' : 'hidden'}>
                                    {text}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </IconButton>
            </Tooltip>
        </Grid>
    );
};

export { ProfileButton };
