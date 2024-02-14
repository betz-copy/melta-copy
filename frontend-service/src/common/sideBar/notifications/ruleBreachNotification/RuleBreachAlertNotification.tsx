import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachAlertNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { environment } from '../../../../globals';

export const RuleBreachAlertNotification: React.FC<IRuleBreachAlertNotificationMetadataPopulated> = ({ alert, titleColor }) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.ruleBreachAlert)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1" color={titleColor} borderLeft={`4px solid ${color}`} paddingLeft="10px">
                    {i18next.t('ruleBreachAlertNotification.breach')}
                </Typography>
                <Typography>{i18next.t('ruleBreachAlertNotification.payAttention')}</Typography>
            </Grid>
            <Grid item>
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
