import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IArchiveProcessNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { ProcessName } from './ProcessName';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';

export const ArchiveProcessNotification: React.FC<{ notificationMetadata: IArchiveProcessNotificationMetadataPopulated; titleColor: string }> = ({
    notificationMetadata: { process, isArchived },
    titleColor,
}) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.archivedProcess)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography display="inline" color={titleColor} paddingLeft="10px">
                    {isArchived
                        ? i18next.t('archiveProcessNotification.sendProcessToArchive')
                        : i18next.t('archiveProcessNotification.removeProcessFromArchive')}
                </Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">{`${i18next.t('archiveProcessNotification.theProcess')} `}</Typography>
                <ProcessName process={process} />
                <Typography display="inline">
                    {isArchived
                        ? i18next.t('archiveProcessNotification.sendToArchivedSuccessfully')
                        : i18next.t('archiveProcessNotification.removeFromArchivedSuccessfully')}
                </Typography>
            </Grid>
        </Grid>
    );
};
