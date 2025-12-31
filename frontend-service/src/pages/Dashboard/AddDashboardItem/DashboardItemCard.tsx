import { Card, Divider, Typography, useTheme } from '@mui/material';
import React from 'react';

export interface DashboardItemCardProps {
    title: string;
    iconSrc?: string;
    onClick: () => void;
    imgSrc: string;
}

const DashboardItemCard: React.FC<DashboardItemCardProps> = ({ onClick, title, imgSrc }) => {
    const theme = useTheme();

    return (
        <Card
            onClick={onClick}
            sx={{
                height: 'fit-content',
                width: '90%',
                boxShadow: '0px 2.03px 6.09px 0px #1E277533',
                borderRadius: '20.3px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: 2.5,
                cursor: 'pointer',
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                    boxShadow: '0px 3px 10px 0px #1E27754D',
                },
            }}
        >
            <Typography fontSize={14} fontWeight={700} color={theme.palette.primary.main}>
                {title}
            </Typography>

            <Divider />

            <img src={imgSrc} alt="imgSrc" />
        </Card>
    );
};

export { DashboardItemCard };
