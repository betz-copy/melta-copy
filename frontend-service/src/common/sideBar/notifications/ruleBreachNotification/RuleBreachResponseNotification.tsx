import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import RuleBreachInfo from '../../../ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachRequestPopulated, RuleBreachRequestStatus } from '../../../../interfaces/ruleBreaches/ruleBreachRequest';

export const RuleBreachResponseNotification: React.FC<{
    ruleBreachRequest: IRuleBreachRequestPopulated;
}> = ({ ruleBreachRequest }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography component="p" variant="body1">
                    {i18next.t('ruleBreachResponseNotification.theRequestOfExecutingTheAction')}
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
            <Grid item>
                <Typography component="p" variant="body1">
                    <Box component="span" fontWeight="bold">
                        {ruleBreachRequest.status === RuleBreachRequestStatus.Approved
                            ? i18next.t('ruleBreachResponseNotification.wasApproved')
                            : i18next.t('ruleBreachResponseNotification.wasDenied')}
                    </Box>{' '}
                    <Box component="span">{i18next.t('ruleBreachResponseNotification.by')}</Box>{' '}
                    <Box component="span" fontWeight="bold">
                        {ruleBreachRequest.reviewer!.fullName}
                    </Box>
                </Typography>
            </Grid>
        </Grid>
    );
};
