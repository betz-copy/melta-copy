import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { INewProcessNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { ProcessName } from './ProcessName';
import { environment } from '../../../../globals';

export const NewProcessNotification: React.FC<INewProcessNotificationMetadataPopulated> = ({ process, titleColor }) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find(({ type }) => type === NotificationType.newProcess)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography color={titleColor} sx={{ borderLeft: `4px solid ${color}`, paddingLeft: '10px' }}>
                    {i18next.t('newProcessNotification.newProcess')}
                </Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">{`${i18next.t('newProcessNotification.processName')} `}</Typography>
                <ProcessName process={process} />
            </Grid>
        </Grid>
    );
};
