import { Box, Grid, Typography } from '@mui/material';
import { IRuleBreachResponseNotificationMetadataPopulated, NotificationType } from '@packages/notification';
import { RuleBreachRequestStatus } from '@packages/rule-breach';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';
import RuleBreachInfo from '../../../ruleBreachInfo/RuleBreachInfo';

const { notificationsMoreData } = environment.notifications;

export const RuleBreachResponseNotification: React.FC<{
    notificationMetadata: IRuleBreachResponseNotificationMetadataPopulated;
}> = ({ notificationMetadata: { request } }) => {
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.ruleBreachResponse)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography component="p" variant="body1" color="primary" fontWeight="bold" paddingLeft="10px">
                    {i18next.t('ruleBreachResponseNotification.theRequestOfExecutingTheAction')}
                </Typography>
            </Grid>
            <Grid>
                <RuleBreachInfo originUser={request.originUser} brokenRules={request.brokenRules} actions={request.actions} isCompact />
            </Grid>
            <Grid>
                <Typography component="p" variant="body1">
                    <Box component="span" fontWeight="bold">
                        {request.status === RuleBreachRequestStatus.Approved
                            ? i18next.t('ruleBreachResponseNotification.wasApproved')
                            : i18next.t('ruleBreachResponseNotification.wasDenied')}
                    </Box>{' '}
                    <Box component="span">{i18next.t('ruleBreachResponseNotification.by')}</Box>{' '}
                    <Box component="span" fontWeight="bold">
                        {request.reviewer!.fullName}
                    </Box>
                </Typography>
            </Grid>
        </Grid>
    );
};
