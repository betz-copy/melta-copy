import { INotificationGroupCountDetails } from '@microservices/shared';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React from 'react';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { NotificationCount } from './NotificationCount';

interface NotificationsButtonProps {
    notificationCountDetails: INotificationGroupCountDetails;
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    iconColor?: string;
}

export const NotificationsButton: React.FC<NotificationsButtonProps> = ({
    notificationCountDetails,
    text,
    isDrawerOpen,
    onClick,
    iconColor = 'white',
}) => {
    return (
        <Grid container direction="column" alignItems="center">
            <MeltaTooltip
                title={text}
                placement="left"
                disableHoverListener={isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
            >
                <IconButton onClick={onClick} sx={{ borderRadius: 10, margin: '0.2rem', paddingBottom: '0', paddingX: '0.5rem' }}>
                    <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                        <Grid container position="relative">
                            <NotificationsIcon sx={{ color: iconColor, fontSize: 30, width: '30px', height: '30px' }} />
                            <NotificationCount
                                notificationCount={notificationCountDetails.total}
                                style={{
                                    position: 'absolute',
                                    top: '30%',
                                    left: '30%',
                                    transform: 'translate(-50%, -50%)',
                                    userSelect: 'none',
                                }}
                            />
                        </Grid>
                    </Grid>
                </IconButton>
            </MeltaTooltip>
        </Grid>
    );
};
