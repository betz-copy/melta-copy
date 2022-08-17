import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';

const EntityDates: React.FC<{ createdAt: string; updatedAt: string }> = ({ createdAt, updatedAt }) => {
    return (
        <Grid item container justifyContent="space-around">
            <Typography color="gray">{`${i18next.t('entityPage.createdAt')}: ${new Date(createdAt).toLocaleString('en-uk')}`}</Typography>
            <Typography color="gray">{`${i18next.t('entityPage.updatedAt')}: ${new Date(updatedAt).toLocaleString('en-uk')}`}</Typography>
        </Grid>
    );
};

export { EntityDates };
