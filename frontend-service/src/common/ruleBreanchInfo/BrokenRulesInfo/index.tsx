import React from 'react';
import { Grid, List, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { BrokenRuleCompact } from './BrokenRuleCompact';
import { BrokenRuleFull } from './BrokenRuleFull';
import { IRuleMap } from '../../../interfaces/rules';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IActionMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';

export const BrokenRulesInfo: React.FC<{
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actionMetadata: IActionMetadataPopulated;
    isCompact: boolean;
}> = ({ brokenRules, actionMetadata, isCompact }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography variant="body1" sx={{ textDecoration: 'underline' }}>{`${i18next.t(
                    'ruleBreachInfo.brokeTheFollowingRules',
                )}:`}</Typography>
            </Grid>
            <Grid item>
                <List dense={isCompact}>
                    {brokenRules.map((brokenRule) => {
                        const ruleTemplate = rules.get(brokenRule.ruleId)!;
                        return isCompact ? (
                            <BrokenRuleCompact key={brokenRule.ruleId} brokenRule={brokenRule} ruleTemplate={ruleTemplate} />
                        ) : (
                            <BrokenRuleFull
                                key={brokenRule.ruleId}
                                brokenRule={brokenRule}
                                ruleTemplate={ruleTemplate}
                                actionMetadata={actionMetadata}
                            />
                        );
                    })}
                </List>
            </Grid>
        </Grid>
    );
};
