import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Collapse, Grid, Typography } from '@mui/material';
import { IActionPopulated } from '@packages/action';
import i18next from 'i18next';
import React, { useState } from 'react';
import { ActionInfo } from '../ActionInfo';

export const BrokenRuleActions: React.FC<{
    actions: IActionPopulated[];
    failedProperties: string[];
}> = ({ actions, failedProperties }) => {
    const [openActions, setOpenActions] = useState(false);

    if (!actions.length) return null;

    return (
        <Grid>
            <Grid>
                <Grid container alignItems="center">
                    <Grid paddingTop="8px">
                        {openActions ? (
                            <ExpandLessIcon sx={{ color: '#787C9E', width: '20px', height: '20px' }} />
                        ) : (
                            <ExpandMoreIcon sx={{ color: '#787C9E', width: '20px', height: '20px' }} />
                        )}
                    </Grid>
                    <Grid style={{ width: 'fit-content', cursor: 'pointer' }} onClick={() => setOpenActions((prev) => !prev)}>
                        {i18next.t('ruleBreachInfo.actionsBrokeTheFollowingRules')}
                    </Grid>
                </Grid>
                <Collapse in={openActions} timeout="auto" unmountOnExit style={{ marginRight: '15px' }}>
                    {actions.map((action, index) => {
                        return (
                            <Grid container key={JSON.stringify(action.actionMetadata)} spacing={1}>
                                <Grid>
                                    <Typography>{index + 1}.</Typography>
                                </Grid>

                                <Grid>
                                    <ActionInfo
                                        actionType={action.actionType}
                                        actionMetadata={action.actionMetadata}
                                        isCompact
                                        actionIndex={index}
                                        actions={actions}
                                        failedProperties={failedProperties}
                                    />
                                </Grid>
                            </Grid>
                        );
                    })}
                </Collapse>
            </Grid>
        </Grid>
    );
};
