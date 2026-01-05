import { Box, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { IMongoRule } from '@packages/rule';
import { IBrokenRulePopulated } from '@packages/rule-breach';
import React from 'react';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { RuleIcon } from './RuleIcon';

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
