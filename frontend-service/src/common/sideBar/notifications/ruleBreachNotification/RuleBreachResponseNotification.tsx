import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { RuleBreachRequestStatus } from '../../../../interfaces/ruleBreaches/ruleBreachRequest';
import { IRuleBreachResponseNotificationMetadataPopulated } from '../../../../interfaces/notifications';

export const RuleBreachResponseNotification: React.FC<IRuleBreachResponseNotificationMetadataPopulated> = ({ request }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1">
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
