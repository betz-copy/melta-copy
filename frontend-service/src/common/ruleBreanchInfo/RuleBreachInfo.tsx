import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { ActionTypes, IActionPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import { IUser } from '../../interfaces/users';
import { ActionInfo } from './ActionInfo';
import { BrokenRulesInfo } from './BrokenRulesInfo';

const RuleBreachInfo: React.FC<{
    originUser?: IUser | null;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actions: IActionPopulated[];
    isCompact: boolean;
}> = ({ originUser, brokenRules, actions, isCompact }) => {
    if (!actions) return null;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid>
                {actions.length > 1 && (
                    <Typography variant="body1" sx={{ textDecoration: 'underline' }}>{`${actions.length} ${i18next.t(
                        'ruleBreachInfo.actionsBrokeTheFollowingRules',
                    )}:`}</Typography>
                )}
                {actions.length === 1 && actions[0].actionType !== ActionTypes.CronjobRun && (
                    <Typography variant="body1" sx={{ textDecoration: 'underline' }}>{`${i18next.t(
                        'ruleBreachInfo.actionBrokeTheFollowingRules',
                    )}:`}</Typography>
                )}
            </Grid>
            {actions.map((action, index) => {
                return (
                    <Grid
                        container
                        key={JSON.stringify(action.actionMetadata)}
                        borderBottom={actions.length > 1 ? 0.2 : 0}
                        borderColor="#d3d3d3"
                        spacing={2}
                    >
                        {actions.length > 1 && (
                            <Grid>
                                <Typography sx={{ textDecoration: 'underline' }}>{index + 1}</Typography>
                            </Grid>
                        )}

                        <Grid marginBottom={2}>
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
            <Grid>
                <BrokenRulesInfo brokenRules={brokenRules} actions={actions} isCompact={isCompact} />
            </Grid>
        </Grid>
    );
};

export default RuleBreachInfo;
