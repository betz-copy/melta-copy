import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import { ActionInfo } from './ActionInfo';
import { BrokenRulesInfo } from './BrokenRulesInfo';
import { IUser } from '../../interfaces/users';
import { IActionPopulated } from '../../interfaces/ruleBreaches/actionMetadata';

const RuleBreachInfo: React.FC<{
    originUser?: IUser;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actions: IActionPopulated[];
    isCompact: boolean;
}> = ({ originUser, brokenRules, actions, isCompact }) => {
    if (!actions) return null;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                {actions.length > 1 && (
                    <Typography variant="body1" sx={{ textDecoration: 'underline' }}>{`${actions.length} ${i18next.t(
                        'ruleBreachInfo.actionsBrokeTheFollowingRules',
                    )}:`}</Typography>
                )}
                {actions.length === 1 && (
                    <Typography variant="body1" sx={{ textDecoration: 'underline' }}>{`${i18next.t(
                        'ruleBreachInfo.actionBrokeTheFollowingRules',
                    )}:`}</Typography>
                )}
            </Grid>
            {actions.map((action, index) => {
                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <Grid item container key={index} borderBottom={actions.length > 1 ? 0.2 : 0} borderColor="#d3d3d3" spacing={2}>
                        {actions.length > 1 && (
                            <Grid item>
                                <Typography sx={{ textDecoration: 'underline' }}>{index + 1}</Typography>
                            </Grid>
                        )}

                        <Grid item>
                            <ActionInfo
                                originUser={originUser}
                                actionType={action.actionType}
                                actionMetadata={action.actionMetadata}
                                isCompact={isCompact}
                                actionIndex={index}
                                actions={actions}
                            />
                        </Grid>
                    </Grid>
                );
            })}
            <Grid item>
                <BrokenRulesInfo brokenRules={brokenRules} actions={actions} isCompact={isCompact} />
            </Grid>
        </Grid>
    );
};

export default RuleBreachInfo;
