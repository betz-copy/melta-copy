import { Grid, List } from '@mui/material';
import { IActionPopulated } from '@packages/action';
import { IRuleMap } from '@packages/rule';
import { IRuleBreachPopulated } from '@packages/rule-breach';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useDarkModeStore } from '../../../stores/darkMode';
import { BrokenRuleCompact } from './BrokenRuleCompact';
import { BrokenRuleFull } from './BrokenRuleFull';

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
            <Grid>
                <List dense={isCompact}>
                    <Grid container width="100%" flexDirection="column" rowGap="20px">
                        {brokenRules.map((brokenRule, index) => {
                            const ruleTemplate = rules.get(brokenRule.ruleId)!;
                            return isCompact ? (
                                <BrokenRuleCompact key={`${brokenRule.ruleId}/${index}`} brokenRule={brokenRule} ruleTemplate={ruleTemplate} />
                            ) : (
                                <Grid
                                    style={{
                                        backgroundColor: darkMode ? 'transparent' : '#F0F2F7',
                                        borderRadius: '10px',
                                        border: darkMode ? '1px solid #F0F2F7' : '',
                                    }}
                                    key={`${brokenRule.ruleId}/${index}`}
                                >
                                    <BrokenRuleFull brokenRule={brokenRule} ruleTemplate={ruleTemplate} actions={actions} />
                                </Grid>
                            );
                        })}
                    </Grid>
                </List>
            </Grid>
        </Grid>
    );
};
