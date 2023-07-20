import React, { CSSProperties } from 'react';
import { Grid, Card, CardContent } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface ViewingBoxProps {
    children: React.ReactNode;
    minHeight?: CSSProperties['height'];
    maxHeight?: CSSProperties['height'];
}

export const ViewingBox: React.FC<ViewingBoxProps> = ({ children, minHeight = 'auto', maxHeight = '21rem' }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    if (Array.isArray(children) && !children.length) return null;

    return (
        <Card
            sx={{
                width: '100%',
                minHeight,
                maxHeight,
                borderRadius: 5,
                padding: '1.6rem',
                bgcolor: darkMode ? '#252525' : '#f7f7f7',
                boxShadow: `inset 0 0 7px 0 rgba(0, 0, 0, ${darkMode ? 0.3 : 0.2})`,
                overflowY: 'overlay',
                '::-webkit-scrollbar-track': { marginY: '1rem', bgcolor: 'transparent' },
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
