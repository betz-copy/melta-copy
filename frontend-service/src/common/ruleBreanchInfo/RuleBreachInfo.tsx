import React from 'react';
import { Grid } from '@mui/material';
import { ActionTypes, IActionMetadataPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import { ActionInfo } from './ActionInfo';
import { BrokenRulesInfo } from './BrokenRulesInfo';
import { IUser } from '../../services/kartoffelService';

const RuleBreachInfo: React.FC<{
    originUser?: IUser;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    isCompact: boolean;
}> = ({ originUser, brokenRules, actionType, actionMetadata, isCompact }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <ActionInfo originUser={originUser} actionType={actionType} actionMetadata={actionMetadata} isCompact={isCompact} />
            </Grid>
            <Grid item>
                <BrokenRulesInfo brokenRules={brokenRules} actionMetadata={actionMetadata} isCompact={isCompact} />
            </Grid>
        </Grid>
    );
};

export default RuleBreachInfo;
