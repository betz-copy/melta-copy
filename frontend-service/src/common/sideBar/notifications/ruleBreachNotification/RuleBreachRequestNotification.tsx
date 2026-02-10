import { Grid, Typography } from '@mui/material';
import { IRuleBreachRequestNotificationMetadataPopulated, NotificationType } from '@packages/notification';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';
import RuleBreachInfo from '../../../ruleBreachInfo/RuleBreachInfo';

const { notificationsMoreData } = environment.notifications;

export const RuleBreachRequestNotification: React.FC<{ notificationMetadata: IRuleBreachRequestNotificationMetadataPopulated }> = ({
    notificationMetadata: { request },
}) => {
    const color = notificationsMoreData.requests.find((notificationData) => notificationData.type === NotificationType.ruleBreachRequest)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography component="p" variant="body1" color="primary" fontWeight="bold" paddingLeft="10px">
                    {i18next.t('ruleBreachRequestNotification.requestWaitingForApproval')}
                </Typography>
            </Grid>
            <Grid>
                <RuleBreachInfo originUser={request.originUser} brokenRules={request.brokenRules} actions={request.actions} isCompact />
            </Grid>
        </Grid>
    );
};
