import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

const EntityDates: React.FC<{ createdAt: string; updatedAt: string }> = ({ createdAt, updatedAt }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Grid item container justifyContent="space-around">
            <Typography color={darkMode ? '#cecece' : 'gray'}>{`${i18next.t('entityPage.createdAt')}: ${new Date(createdAt).toLocaleString(
                'en-uk',
            )}`}</Typography>
            <Typography color={darkMode ? '#cecece' : 'gray'}>{`${i18next.t('entityPage.updatedAt')}: ${new Date(updatedAt).toLocaleString(
                'en-uk',
            )}`}</Typography>
        </Grid>
    );
};

export { EntityDates };
