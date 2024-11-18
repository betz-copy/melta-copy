import { Grid } from '@mui/material';
import React from 'react';

interface NotificationColorProps {
    color: string;
}

const NotificationColor: React.FC<NotificationColorProps> = ({ color }) => {
    return (
        <Grid
            style={{
                marginTop: '4px',
                height: '16px',
                width: '3px',
                backgroundColor: color,
                borderRadius: '2.5px',
            }}
        />
    );
};

export { NotificationColor };
