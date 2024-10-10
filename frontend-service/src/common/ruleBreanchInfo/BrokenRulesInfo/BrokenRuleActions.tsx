/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import i18next from 'i18next';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Collapse, Grid, Typography } from '@mui/material';
import { IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { ActionInfo } from '../ActionInfo';

export const BrokenRuleActions: React.FC<{
    actions: IActionPopulated[];
}> = ({ actions }) => {
    const [openActions, setOpenActions] = useState(false);

    return (
        <Grid>
            {actions.length > 0 && (
                <Grid item>
                    <Grid item container alignItems="center">
                        <Grid item paddingTop="8px">
                            {openActions ? (
                                <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                            ) : (
                                <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                            )}
                        </Grid>
                        <Grid style={{ width: 'fit-content', cursor: 'pointer' }} onClick={() => setOpenActions((prev) => !prev)}>
                            {i18next.t('ruleBreachInfo.actionsBrokeTheFollowingRules')}
                        </Grid>
                    </Grid>
                    <Collapse in={openActions} timeout="auto" unmountOnExit>
                        {actions.map((action, index) => {
                            return (
                                <Grid item container key={index} spacing={2}>
                                    <Grid item>
                                        <Typography>{index + 1}.</Typography>
                                    </Grid>

                                    <Grid item>
                                        <ActionInfo
                                            actionType={action.actionType}
                                            actionMetadata={action.actionMetadata}
                                            isCompact
                                            actionIndex={index}
                                            actions={actions}
                                        />
                                    </Grid>
                                </Grid>
                            );
                        })}
                    </Collapse>
                </Grid>
            )}
        </Grid>
    );
};
