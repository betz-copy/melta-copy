import { INewProcessNotificationMetadataPopulated, NotificationType } from '@microservices/shared';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';
import { ProcessName } from './ProcessName';

export const NewProcessNotification: React.FC<{ notificationMetadata: INewProcessNotificationMetadataPopulated }> = ({
    notificationMetadata: { process },
}) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find(({ type }) => type === NotificationType.newProcess)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography color="primary" fontWeight="bold" sx={{ paddingLeft: '10px' }}>
                    {i18next.t('newProcessNotification.newProcess')}
                </Typography>
            </Grid>
            <Grid>
                <Typography display="inline">{`${i18next.t('newProcessNotification.processName')} `}</Typography>
                <ProcessName process={process} />
            </Grid>
        </Grid>
    );
};
