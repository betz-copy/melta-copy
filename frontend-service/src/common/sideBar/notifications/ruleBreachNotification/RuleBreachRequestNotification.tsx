import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachRequestNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';

export const RuleBreachRequestNotification: React.FC<{ notificationMetadata: IRuleBreachRequestNotificationMetadataPopulated }> = ({
    notificationMetadata: { request },
}) => {
    const { notificationsMoreData } = environment.staticConfigs.notifications;
    const color = notificationsMoreData.requests.find((notificationData) => notificationData.type === NotificationType.ruleBreachRequest)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography component="p" variant="body1" color="primary" fontWeight="bold" paddingLeft="10px">
                    {i18next.t('ruleBreachRequestNotification.requestWaitingForApproval')}
                </Typography>
            </Grid>
            <Grid item>
                <RuleBreachInfo originUser={request.originUser} brokenRules={request.brokenRules} actions={request.actions} isCompact />
            </Grid>
        </Grid>
    );
};
