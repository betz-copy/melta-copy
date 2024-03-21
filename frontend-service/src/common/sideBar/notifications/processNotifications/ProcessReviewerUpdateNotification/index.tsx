import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IProcessReviewerUpdateNotificationMetadataPopulated, NotificationType } from '../../../../../interfaces/notifications';
import { Description } from './Description';
import { environment } from '../../../../../globals';
import { NotificationColor } from '../../../../notificationColor';

export const ProcessReviewerUpdateNotification: React.FC<IProcessReviewerUpdateNotificationMetadataPopulated> = (metadata) => {
    const { notificationsMoreData } = environment.notifications;
    const { titleColor } = metadata;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.processReviewerUpdate)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography color={titleColor} paddingLeft="10px">
                    {i18next.t('processReviewerUpdateNotification.reviewerUpdate')}
                </Typography>
            </Grid>
            <Description {...metadata} />
        </Grid>
    );
};
