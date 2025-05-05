import { Card, Divider, Typography, useTheme } from '@mui/material';
import React from 'react';

export interface DashboardItemCardProps {
    title: string;
    iconSrc?: string;
    onClick: () => void;
    content: React.ReactNode;
}

const DashboardItemCard: React.FC<DashboardItemCardProps> = ({ onClick, title, content }) => {
    const theme = useTheme();

    return (
        <Card
            onClick={onClick}
            style={{
                height: 'fit-content',
                width: '90%',
                boxShadow: '0px 2.03px 6.09px 0px #1E277533',
                borderRadius: '20.3px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                padding: 20,
                cursor: 'pointer',
            }}
        >
            <Typography fontSize={14} fontWeight={700} color={theme.palette.primary.main}>
                {title}
            </Typography>

            <Divider />

            {content}
        </Card>
    );
};

export { DashboardItemCard };
