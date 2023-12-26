import React from 'react';
import { Box, ListItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import { RuleIcon } from './RuleIcon';

export const BrokenRuleCompact: React.FC<{ brokenRule: IRuleBreachPopulated['brokenRules'][number]; ruleTemplate: IMongoRule }> = ({
    brokenRule,
    ruleTemplate,
}) => {
    return (
        <ListItem key={brokenRule.ruleId}>
            <ListItemIcon>
                <RuleIcon ruleType={ruleTemplate.actionOnFail} />
            </ListItemIcon>
            <ListItemText>
                <Tooltip
                    title={ruleTemplate.description}
                    PopperProps={{
                        sx: { '& .MuiTooltip-tooltip': { fontSize: '0.8rem' } },
                    }}
                >
                    <Box component="span" sx={{ fontWeight: 'bold' }}>
                        {ruleTemplate.name}
                    </Box>
                </Tooltip>
            </ListItemText>
        </ListItem>
    );
};
