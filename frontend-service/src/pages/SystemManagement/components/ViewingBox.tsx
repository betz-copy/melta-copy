import React, { CSSProperties, ComponentProps } from 'react';
import { Grid, Card, CardContent } from '@mui/material';
import { useDarkModeStore } from '../../../stores/darkMode';

interface ViewingBoxProps {
    children: React.ReactNode;
    minHeight?: CSSProperties['height'];
    maxHeight?: CSSProperties['height'];
    gridProps?: ComponentProps<typeof Grid>;
}

export const ViewingBox: React.FC<ViewingBoxProps> = ({ children, minHeight = 'auto', maxHeight = '21rem', gridProps }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    if (Array.isArray(children) && !children.length) return null;

    return (
        <Card
            sx={{
                width: '100%',
                minHeight,
                maxHeight,
                borderRadius: 5,
                padding: '1.6rem',
                bgcolor: darkMode ? '#252525' : '#E0E1ED',
                boxShadow: '0px 2px 6px 0px rgba(30, 39, 117, 0.30);',
                overflowY: 'overlay',
                '::-webkit-scrollbar-track': { marginY: '1rem', bgcolor: 'transparent' },
            }}
        >
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                <Grid container spacing={4} {...gridProps}>
                    {children}
                </Grid>
            </CardContent>
        </Card>
    );
};
