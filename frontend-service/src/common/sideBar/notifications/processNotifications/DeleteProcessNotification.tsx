import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../globals';
import { IDeleteProcessNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { NotificationColor } from '../../../notificationColor';

export const DeleteProcessNotification: React.FC<{ notificationMetadata: IDeleteProcessNotificationMetadataPopulated }> = ({
    notificationMetadata: { processName },
}) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.deleteProcess)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography display="inline" color="primary" fontWeight="bold" paddingLeft="10px">
                    {`${i18next.t('deleteProcessNotification.deleteProcessNotification')} `}
                </Typography>
            </Grid>
            <Grid>
                <Typography display="inline">{`${i18next.t('deleteProcessNotification.theProcess')} `}</Typography>
                <Typography display="inline" fontWeight="bold">{`${processName} `}</Typography>

                <Typography display="inline">{i18next.t('deleteProcessNotification.processDeleteSuccessfully')}</Typography>
            </Grid>
        </Grid>
    );
};
