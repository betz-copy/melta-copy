import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { INewProcessNotificationMetadataPopulated } from '../../../../interfaces/notifications';
import { ProcessName } from './ProcessName';

export const NewProcessNotification: React.FC<INewProcessNotificationMetadataPopulated> = ({ process }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography>{i18next.t('newProcessNotification.newProcess')}</Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">{`${i18next.t('newProcessNotification.processName')} `}</Typography>
                <ProcessName process={process} />
            </Grid>
        </Grid>
    );
};
