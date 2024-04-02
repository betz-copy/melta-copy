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
            borderRadius={25}
            fontSize={12}
            minWidth="1.4rem"
            minHeight="1.4rem"
            fontWeight="bold"
            color="white"
            bgcolor="#FF006B"
            borderRight="0.22rem solid #FF006B"
            borderLeft="0.3rem solid #FF006B"
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
