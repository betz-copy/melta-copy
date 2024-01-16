import React, { CSSProperties } from 'react';
import { Grid, Card, CardContent, SxProps, Theme } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface BoxProps {
    children: React.ReactNode;
    header: React.ReactNode;
    addingIcon: React.ReactNode;
    onHover?: (boolean) => void;
}

export const Box: React.FC<BoxProps> = ({ children, header, addingIcon, onHover }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    if (Array.isArray(children) && !children.length) return null;

    return (
        <Card
            onMouseEnter={() => (onHover ? onHover(true) : '')}
            onMouseLeave={() => (onHover ? onHover(false) : '')}
            sx={{
                borderRadius: 5,
                padding: '10px',
                bgcolor: darkMode ? '#252525' : '#E0E1ED',
                boxShadow: '0px 2px 6px 0px rgba(30, 39, 117, 0.30);',
                overflowY: 'overlay',
                '::-webkit-scrollbar-track': { marginY: '1rem', bgcolor: 'transparent' },
            }}
        >
            <Grid container direction="column">
                {header}
                <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                    <Grid item container gap="15px" direction="column">
                        {children}
                    </Grid>
                </CardContent>
                {addingIcon}
            </Grid>
        </Card>
    );
};
