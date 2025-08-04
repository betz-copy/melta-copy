import { Grid, Typography } from '@mui/material';
import React from 'react';
import { DayNightSwitch } from '../inputs/DayNightSwitch';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';

interface SwitchThemeButtonProps {
    text: string;
    isDrawerOpen: boolean;
    onClick: React.MouseEventHandler;
    darkMode: boolean;
}

export const SwitchThemeButton: React.FC<SwitchThemeButtonProps> = ({ text, isDrawerOpen, onClick, darkMode }) => {
    return (
        <MeltaTooltip title={text} arrow placement="left" disableHoverListener={isDrawerOpen}>
            <Grid container alignItems="center" justifyContent="space-around" spacing={isDrawerOpen ? -9 : 0}>
                <Grid item width="4rem">
                    <DayNightSwitch checked={darkMode} onClick={onClick} />
                </Grid>

                {isDrawerOpen && (
                    <Grid item>
                        <Typography color="white">{text}</Typography>
                    </Grid>
                )}
            </Grid>
        </MeltaTooltip>
    );
};
