import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachAlertNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';

export const RuleBreachAlertNotification: React.FC<{ notificationMetadata: IRuleBreachAlertNotificationMetadataPopulated; titleColor: string }> = ({
    notificationMetadata: { alert },
    titleColor,
}) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.ruleBreachAlert)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography component="p" variant="body1" color={titleColor} paddingLeft="10px">
                    {i18next.t('ruleBreachAlertNotification.breach')}
                </Typography>
            </Grid>
            <Grid item>
                <Typography>{i18next.t('ruleBreachAlertNotification.payAttention')}</Typography>
                <RuleBreachInfo
                    originUser={alert.originUser}
                    brokenRules={alert.brokenRules}
                    actionType={alert.actionType}
                    actionMetadata={alert.actionMetadata}
                    isCompact
                />
            </Grid>
        </Grid>
    );
};
