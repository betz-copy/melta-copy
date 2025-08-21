import { ChevronLeft as ArrowLeftIcon, ChevronRight as ArrowRightIcon } from '@mui/icons-material';
import { Divider, Grid, IconButton } from '@mui/material';
import React, { CSSProperties, ReactNode } from 'react';
import { useDarkModeStore } from '../stores/darkMode';

interface CompactDrawerProps {
    toggleMinimized: () => void;
    open: boolean;
    locked?: boolean;
    style?: CSSProperties;
    styleOpen?: CSSProperties;
    styleClosed?: CSSProperties;
    children?: ReactNode;
}

export const CompactDrawer: React.FC<CompactDrawerProps> = ({ toggleMinimized, open, locked, style, styleOpen, styleClosed, children }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            height="100%"
            wrap="nowrap"
            bgcolor={darkMode ? '#161616' : 'white'}
            sx={{ transition: 'all 0.8s ease-in-out', ...style, ...(open ? styleOpen : styleClosed) }}
        >
            <Grid height="94%" width="100%">
                {children}
            </Grid>

            <Grid container direction="column" size={{ xs: 12 }}>
                <Divider />
                <IconButton disabled={locked} onClick={toggleMinimized} size="small" style={{ borderRadius: 0, height: '3rem' }}>
                    {open ? <ArrowLeftIcon /> : <ArrowRightIcon />}
                </IconButton>
            </Grid>
        </Grid>
    );
};
