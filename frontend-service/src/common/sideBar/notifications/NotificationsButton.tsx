import { Grid, IconButton, Tooltip, tooltipClasses, Typography } from '@mui/material';
import React from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface NotificationsButtonProps {
    notificationCount: number;
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const NotificationsButton: React.FC<NotificationsButtonProps> = ({ notificationCount, text, isDrawerOpen, onClick }) => {
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
                <IconButton onClick={onClick} sx={{ borderRadius: 10, margin: '0.2rem', paddingBottom: '0', paddingX: '0.5rem' }}>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item position="relative">
                            <NotificationsIcon sx={{ color: 'white', fontSize: 38 }} />
                            {Boolean(notificationCount) && (
                                <Typography
                                    fontWeight="bold"
                                    fontSize={12}
                                    color="white"
                                    bgcolor="red"
                                    borderRadius={25}
                                    paddingX="0.3rem"
                                    paddingTop="0.1rem"
                                    paddingBottom={0}
                                    position="absolute"
                                    top="30%"
                                    left="30%"
                                    sx={{ transform: 'translate(-50%, -50%)', userSelect: 'none' }}
                                >
                                    {notificationCount}
                                </Typography>
                            )}
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
