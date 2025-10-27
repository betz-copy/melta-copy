import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../globals';
import { IRuleBreachAlertNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { NotificationColor } from '../../../notificationColor';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';

export const RuleBreachAlertNotification: React.FC<{ notificationMetadata: IRuleBreachAlertNotificationMetadataPopulated }> = ({
    notificationMetadata: { alert },
}) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.ruleBreachAlert)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography component="p" variant="body1" color="primary" fontWeight="bold" paddingLeft="10px">
                    {i18next.t('ruleBreachAlertNotification.breach')}
                </Typography>
            </Grid>
            <Grid>
                <Typography>{i18next.t('ruleBreachAlertNotification.payAttention')}</Typography>
                <RuleBreachInfo originUser={alert.originUser} brokenRules={alert.brokenRules} actions={alert.actions} isCompact />
            </Grid>
        </Grid>
    );
};
