import React from 'react';
import { Typography } from '@mui/material';

interface NotificationCountProps {
    notificationCount?: number;
    style?: React.CSSProperties;
}

export const NotificationCount: React.FC<NotificationCountProps> = ({ notificationCount, style }) => {
    if (!notificationCount) return null;

    const color = '#FF1D18';

    return (
        <Typography
            borderRadius={25}
            fontSize={12}
            minWidth="1.25rem"
            fontWeight="bold"
            color="white"
            bgcolor={color}
            borderRight={`0.22rem solid ${color}`}
            borderLeft={`0.3rem solid ${color}`}
            paddingTop="0.1rem"
            paddingBottom={0}
            paddingX={0}
            align="center"
            sx={{ userSelect: 'none', direction: 'rtl', ...style }}
        >
            {notificationCount}
        </Typography>
    );
};
