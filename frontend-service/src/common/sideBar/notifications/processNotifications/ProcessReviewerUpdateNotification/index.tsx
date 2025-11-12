import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../../globals';
import { IProcessReviewerUpdateNotificationMetadataPopulated, NotificationType } from '../../../../../interfaces/notifications';
import { NotificationColor } from '../../../../notificationColor';
import { Description } from './Description';

export const ProcessReviewerUpdateNotification: React.FC<{
    notificationMetadata: IProcessReviewerUpdateNotificationMetadataPopulated;
}> = ({ notificationMetadata }) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.processReviewerUpdate)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography fontWeight="bold" color="primary" paddingLeft="10px">
                    {i18next.t('processReviewerUpdateNotification.reviewerUpdate')}
                </Typography>
            </Grid>
            <Description {...notificationMetadata} />
        </Grid>
    );
};
