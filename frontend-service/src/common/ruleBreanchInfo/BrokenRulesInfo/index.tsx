import React from 'react';
import { Grid, List } from '@mui/material';
import { useQueryClient } from 'react-query';
import { IRuleMap, IRuleBreachPopulated, IActionPopulated } from '@microservices/shared-interfaces';
import { BrokenRuleCompact } from './BrokenRuleCompact';
import { BrokenRuleFull } from './BrokenRuleFull';
import { useDarkModeStore } from '../../../stores/darkMode';

export const BrokenRulesInfo: React.FC<{
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actions: IActionPopulated[];
    isCompact: boolean;
}> = ({ brokenRules, actions, isCompact }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const allRulesExist = brokenRules.every((brokenRule) => rules.has(brokenRule.ruleId));

    if (!allRulesExist) return null;
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <List dense={isCompact}>
                    <Grid container item width="100%" flexDirection="column" rowGap="20px">
                        {brokenRules.map((brokenRule, index) => {
                            const ruleTemplate = rules.get(brokenRule.ruleId)!;
                            return isCompact ? (
                                // eslint-disable-next-line react/no-array-index-key
                                <BrokenRuleCompact key={`${brokenRule.ruleId}/${index}`} brokenRule={brokenRule} ruleTemplate={ruleTemplate} />
                            ) : (
                                <Grid
                                    item
                                    style={{
                                        backgroundColor: darkMode ? 'transparent' : '#F0F2F7',
                                        borderRadius: '10px',
                                        border: darkMode ? '1px solid #F0F2F7' : '',
                                    }}
                                >
                                    <BrokenRuleFull
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={`${brokenRule.ruleId}/${index}`}
                                        brokenRule={brokenRule}
                                        ruleTemplate={ruleTemplate}
                                        actions={actions}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                </List>
            </Grid>
        </Grid>
    );
};
