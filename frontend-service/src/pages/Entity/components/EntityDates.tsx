import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { getLongDate } from '../../../utils/date';
import { useDarkModeStore } from '../../../stores/darkMode';

const EntityDates: React.FC<{ createdAt: string; updatedAt: string }> = ({ createdAt, updatedAt }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid item container justifyContent="space-between">
            <Typography color={darkMode ? '#cecece' : '#787C9E'} fontSize="12px" fontWeight="400">{`${i18next.t(
                'entityPage.createdAt',
            )}: ${getLongDate(new Date(createdAt))}`}</Typography>
            <Typography color={darkMode ? '#cecece' : '#787C9E'} fontSize="12px" fontWeight="400">{`${i18next.t(
                'entityPage.updatedAt',
            )}: ${getLongDate(new Date(updatedAt))}`}</Typography>
        </Grid>
    );
};

export { EntityDates };
