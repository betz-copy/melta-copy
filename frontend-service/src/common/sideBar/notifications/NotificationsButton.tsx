import { Grid, IconButton, Tooltip, tooltipClasses, Typography } from '@mui/material';
import React from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { NotificationCount } from './NotificationCount';
import { INotificationGroupCountDetails } from '../../../interfaces/notifications';

interface NotificationsButtonProps {
    notificationCountDetails: INotificationGroupCountDetails;
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const NotificationsButton: React.FC<NotificationsButtonProps> = ({ notificationCountDetails, text, isDrawerOpen, onClick }) => (
    <Grid container direction="column" alignItems="center">
        <Tooltip
            title={text}
            placement="left"
            disableHoverListener={isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
            PopperProps={{
                sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
            }}
        >
            <IconButton onClick={onClick} sx={{ borderRadius: 10, margin: '0.2rem', paddingBottom: '0', paddingX: '0.5rem' }}>
                <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                    <Grid item position="relative">
                        <NotificationsIcon sx={{ color: 'white', fontSize: 38, width: '36px', height: '34px' }} />
                        <NotificationCount
                            notificationCount={notificationCountDetails.total}
                            style={{
                                position: 'absolute',
                                top: '30%',
                                left: '30%',
                                transform: 'translate(-50%, -50%)',
                                userSelect: 'none',
                                backgroundColor: '#FF006B',
                            }}
                        />
                    </Grid>
                </Grid>
            </IconButton>
        </Tooltip>
    </Grid>
);
