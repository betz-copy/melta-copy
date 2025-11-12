import { Typography } from '@mui/material';
import React from 'react';
import { environment } from '../../../globals';

interface NotificationCountProps {
    notificationCount?: number;
    style?: React.CSSProperties;
}

const { color } = environment.notifications;

export const NotificationCount: React.FC<NotificationCountProps> = ({ notificationCount, style }) => {
    if (!notificationCount) return null;

    return (
        <Typography
            borderRadius={25}
            fontSize={12}
            minWidth="1.4rem"
            minHeight="1.4rem"
            fontWeight="bold"
            color="white"
            bgcolor={color}
            borderRight={`0.22rem solid ${color}`}
            borderLeft={`0.3rem solid ${color}`}
            paddingTop="0.17rem"
            paddingBottom={0}
            paddingX={0}
            align="center"
            sx={{ userSelect: 'none', direction: 'rtl', ...style }}
        >
            {notificationCount}
        </Typography>
    );
};
