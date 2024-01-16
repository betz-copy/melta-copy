import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IProcessReviewerUpdateNotificationMetadataPopulated, NotificationType } from '../../../../../interfaces/notifications';
import { Description } from './Description';
import { environment } from '../../../../../globals';

export const ProcessReviewerUpdateNotification: React.FC<IProcessReviewerUpdateNotificationMetadataPopulated> = (metadata) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.processReviewerUpdate)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography color="#4752B6" borderLeft={`4px solid ${color}`} paddingLeft="10px">
                    {i18next.t('processReviewerUpdateNotification.reviewerUpdate')}
                </Typography>
            </Grid>
            <Description {...metadata} />
        </Grid>
    );
};
