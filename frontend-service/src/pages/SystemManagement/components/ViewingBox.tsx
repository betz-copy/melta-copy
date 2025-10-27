import { CardContent, Grid } from '@mui/material';
import React, { ComponentProps, CSSProperties } from 'react';

interface ViewingBoxProps {
    children: React.ReactNode;
    minHeight?: CSSProperties['height'];
    maxHeight?: CSSProperties['height'];
    gridProps?: ComponentProps<typeof Grid>;
}

export const ViewingBox: React.FC<ViewingBoxProps> = ({ children, gridProps }) => {
    if (Array.isArray(children) && !children.length) return null;

    return (
        <CardContent sx={{ '&:last-child': { padding: 0 } }}>
            <Grid container spacing={4} {...gridProps}>
                {children}
            </Grid>
        </CardContent>
    );
};
