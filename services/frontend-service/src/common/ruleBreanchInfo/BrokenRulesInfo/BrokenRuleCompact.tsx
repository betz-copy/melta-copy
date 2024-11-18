import React from 'react';
import { Box, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import { RuleIcon } from './RuleIcon';
import { MeltaTooltip } from '../../MeltaTooltip';

export const BrokenRuleCompact: React.FC<{ brokenRule: IBrokenRulePopulated; ruleTemplate: IMongoRule }> = ({ brokenRule, ruleTemplate }) => {
    return (
        <ListItem key={brokenRule.ruleId}>
            <ListItemIcon>
                <RuleIcon ruleType={ruleTemplate.actionOnFail} />
            </ListItemIcon>
            <ListItemText>
                <MeltaTooltip title={ruleTemplate.description}>
                    <Box component="span" sx={{ fontWeight: 'bold' }}>
                        {ruleTemplate.name}
                    </Box>
                </MeltaTooltip>
            </ListItemText>
        </ListItem>
    );
};
