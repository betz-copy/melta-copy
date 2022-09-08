import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IRuleBreachAlertPopulated } from '../../../../interfaces/ruleBreaches/ruleBreachAlert';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';

export const RuleBreachAlertNotification: React.FC<{
    ruleBreachAlert: IRuleBreachAlertPopulated;
}> = ({ ruleBreachAlert }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1">
                    {i18next.t('ruleBreachAlertNotification.payAttention')}
                </Typography>
            </Grid>
            <Grid item>
                <RuleBreachInfo
                    originUser={ruleBreachAlert.originUser}
                    brokenRules={ruleBreachAlert.brokenRules}
                    actionType={ruleBreachAlert.actionType}
                    actionMetadata={ruleBreachAlert.actionMetadata}
                    isCompact
                />
            </Grid>
        </Grid>
    );
};
