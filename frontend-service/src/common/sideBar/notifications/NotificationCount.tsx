import React from 'react';
import { Typography } from '@mui/material';

interface NotificationCountProps {
    notificationCount?: number;
    style?: React.CSSProperties;
}

export const NotificationCount: React.FC<NotificationCountProps> = ({ notificationCount, style }) => {
    if (!notificationCount) return null;

    return (
        <Typography
            borderRadius="20px"
            fontSize={12}
            width="24px"
            height="24px"
            minWidth="1.25rem"
            fontWeight="bold"
            color="white"
            bgcolor="#FF006B"
            display="flex"
            alignItems="center"
            justifyContent="center"
            lineHeight="15.6px"
            sx={{ userSelect: 'none', direction: 'rtl', ...style }}
        >
            {notificationCount}
        </Typography>
    );
};
