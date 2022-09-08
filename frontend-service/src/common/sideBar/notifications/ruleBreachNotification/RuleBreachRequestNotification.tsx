import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachRequestPopulated } from '../../../../interfaces/ruleBreaches/ruleBreachRequest';

export const RuleBreachRequestNotification: React.FC<{
    ruleBreachRequest: IRuleBreachRequestPopulated;
}> = ({ ruleBreachRequest }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1">
                    {i18next.t('ruleBreachRequestNotification.requestWaitingForApproval')}
                </Typography>
            </Grid>
            <Grid item>
                <RuleBreachInfo
                    originUser={ruleBreachRequest.originUser}
                    brokenRules={ruleBreachRequest.brokenRules}
                    actionType={ruleBreachRequest.actionType}
                    actionMetadata={ruleBreachRequest.actionMetadata}
                    isCompact
                />
            </Grid>
        </Grid>
    );
};
