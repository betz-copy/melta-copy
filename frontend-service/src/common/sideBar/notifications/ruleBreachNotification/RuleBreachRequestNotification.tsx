import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachRequestNotificationMetadataPopulated } from '../../../../interfaces/notifications';

export const RuleBreachRequestNotification: React.FC<IRuleBreachRequestNotificationMetadataPopulated> = ({ request }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1">
                    {i18next.t('ruleBreachRequestNotification.requestWaitingForApproval')}
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
        </Grid>
    );
};
