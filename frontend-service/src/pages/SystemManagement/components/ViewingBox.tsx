import React, { CSSProperties } from 'react';
import { Grid, Card, CardContent } from '@mui/material';

interface ViewingBoxProps {
    children: React.ReactNode;
    maxHeight?: CSSProperties['height'];
}

export const ViewingBox: React.FC<ViewingBoxProps> = ({ children, maxHeight = '21rem' }) => {
    if (Array.isArray(children) && !children.length) return null;

    return (
        <Card
            sx={{
                width: '100%',
                maxHeight,
                borderRadius: 5,
                padding: '1.6rem',
                bgcolor: '#f7f7f7',
                boxShadow: 'inset 0 0 7px 0 rgba(0, 0, 0, 0.2)',
                overflowY: 'overlay',
                '::-webkit-scrollbar-track': { marginY: '1rem', borderRadius: 20 },
            }}
        >
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                <Grid container spacing={4}>
                    {children}
                </Grid>
            </CardContent>
        </Card>
    );
};
