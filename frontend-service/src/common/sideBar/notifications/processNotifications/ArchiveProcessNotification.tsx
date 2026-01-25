import { Grid, Typography } from '@mui/material';
import { IArchiveProcessNotificationMetadataPopulated, NotificationType } from '@packages/notification';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';
import { ProcessName } from './ProcessName';

const { notificationsMoreData } = environment.notifications;

export const ArchiveProcessNotification: React.FC<{ notificationMetadata: IArchiveProcessNotificationMetadataPopulated }> = ({
    notificationMetadata: { process, isArchived },
}) => {
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.archivedProcess)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography display="inline" color="primary" fontWeight="bold" paddingLeft="10px">
                    {isArchived
                        ? i18next.t('archiveProcessNotification.sendProcessToArchive')
                        : i18next.t('archiveProcessNotification.removeProcessFromArchive')}
                </Typography>
            </Grid>
            <Grid>
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
