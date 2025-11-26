import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getLongDate } from '../../../utils/date';

const EntityDates: React.FC<{ createdAt: string; updatedAt: string; toPrint?: boolean }> = ({ createdAt, updatedAt, toPrint = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid container justifyContent="space-between">
            <Typography color={!toPrint && darkMode ? '#cecece' : '#787C9E'} fontSize="12px" fontWeight="400">{`${i18next.t(
                'entityPage.createdAt',
            )}: ${getLongDate(new Date(createdAt))}`}</Typography>
            <Typography color={!toPrint && darkMode ? '#cecece' : '#787C9E'} fontSize="12px" fontWeight="400">{`${i18next.t(
                'entityPage.updatedAt',
            )}: ${getLongDate(new Date(updatedAt))}`}</Typography>
        </Grid>
    );
};

export { EntityDates };
