import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachAlertNotificationMetadataPopulated } from '../../../../interfaces/notifications';

export const RuleBreachAlertNotification: React.FC<IRuleBreachAlertNotificationMetadataPopulated> = ({ alert }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1" color="#4752B6">
                    {i18next.t('ruleBreachAlertNotification.payAttention')}
                </Typography>
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
