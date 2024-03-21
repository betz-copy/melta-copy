import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { RuleBreachRequestStatus } from '../../../../interfaces/ruleBreaches/ruleBreachRequest';
import { IRuleBreachResponseNotificationMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';

export const RuleBreachResponseNotification: React.FC<IRuleBreachResponseNotificationMetadataPopulated> = ({ request, titleColor }) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.ruleBreachResponse)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography component="p" variant="body1" color={titleColor} paddingLeft="10px">
                    {i18next.t('ruleBreachResponseNotification.theRequestOfExecutingTheAction')}
                </Typography>
            </Grid>
            <Grid item>
                <RuleBreachInfo
                    originUser={request.originUser}
                    brokenRules={request.brokenRules}
                    actionType={request.actionType}
                    actionMetadata={request.actionMetadata}
                    isCompact
                />
            </Grid>
            <Grid item>
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
