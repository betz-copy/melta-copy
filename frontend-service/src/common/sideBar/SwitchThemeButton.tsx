import { Grid, Tooltip, tooltipClasses, Typography } from '@mui/material';
import React from 'react';
import { DayNightSwitch } from '../inputs/DayNightSwitch';

interface SwitchThemeButtonProps {
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler;
    darkMode: boolean;
}

export const SwitchThemeButton: React.FC<SwitchThemeButtonProps> = ({ text, isDrawerOpen, onClick, darkMode }) => {
    return (
        <Tooltip
            title={text}
            arrow
            placement="left"
            disableHoverListener={isDrawerOpen}
            PopperProps={{
                sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem' } },
            }}
        >
            <Grid container alignItems="center" justifyContent="space-around" spacing={isDrawerOpen ? -9 : 0}>
                <Grid item width="5rem">
                    <DayNightSwitch checked={darkMode} onClick={onClick} />
                </Grid>

                {isDrawerOpen && (
                    <Grid item>
                        <Typography color="white">{text}</Typography>
                    </Grid>
                )}
            </Grid>
        </Tooltip>
    );
};
