import React from 'react';
import { Grid, List, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { BrokenRuleCompact } from './BrokenRuleCompact';
import { BrokenRuleFull } from './BrokenRuleFull';
import { IRuleMap } from '../../../interfaces/rules';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { ActionTypes, IActionMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';

export const BrokenRulesInfo: React.FC<{
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadataPopulated;
    }[];
    isCompact: boolean;
}> = ({ brokenRules, actions, isCompact }) => {
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
                    {brokenRules.map((brokenRule, index) => {
                        const ruleTemplate = rules.get(brokenRule.ruleId)!;
                        return isCompact ? (
                            // eslint-disable-next-line react/no-array-index-key
                            <BrokenRuleCompact key={`${brokenRule.ruleId}/${index}`} brokenRule={brokenRule} ruleTemplate={ruleTemplate} />
                        ) : (
                            <BrokenRuleFull
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${brokenRule.ruleId}/${index}`}
                                brokenRule={brokenRule}
                                ruleTemplate={ruleTemplate}
                                actions={actions}
                            />
                        );
                    })}
                </List>
            </Grid>
        </Grid>
    );
};
