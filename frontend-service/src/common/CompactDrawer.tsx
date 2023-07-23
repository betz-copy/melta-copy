import React, { CSSProperties } from 'react';
import { Divider, Grid, IconButton } from '@mui/material';
import { ChevronRight as ArrowRightIcon, ChevronLeft as ArrowLeftIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface CompactDrawerProps {
    toggleMinimized: () => void;
    open: boolean;
    style?: CSSProperties;
    styleOpen?: CSSProperties;
    styleClosed?: CSSProperties;
}

export const CompactDrawer: React.FC<CompactDrawerProps> = ({ toggleMinimized, open, style, styleOpen, styleClosed, children }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            height="100%"
            bgcolor={darkMode ? '#161616' : 'white'}
            sx={{ ...style, ...(open ? styleOpen : styleClosed) }}
        >
            <Grid item height="94.5%">
                {children}
            </Grid>

            <Grid item container direction="column">
                <Divider />
                <IconButton onClick={toggleMinimized} size="small" style={{ borderRadius: 0, height: '3rem' }}>
                    {open ? <ArrowLeftIcon /> : <ArrowRightIcon />}
                </IconButton>
            </Grid>
        </Grid>
    );
};
