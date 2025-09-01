import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IProcessReviewerUpdateNotificationMetadataPopulated } from '../../../../../interfaces/notifications';
import { ProcessName } from '../ProcessName';
import { StepName } from '../StepName';

export const Description: React.FC<IProcessReviewerUpdateNotificationMetadataPopulated> = ({ process, addedSteps, deletedSteps, unchangedSteps }) => {
    if (!unchangedSteps.length && !addedSteps.length) {
        return (
            <Grid>
                <Typography display="inline">{`${i18next.t('processReviewerUpdateNotification.removedFromProcess')} `}</Typography>
                <ProcessName process={process} />
            </Grid>
        );
    }

    return (
        <>
            <Grid>
                <Typography display="inline">{`${i18next.t('processReviewerUpdateNotification.inProcess')} `}</Typography>
                <ProcessName process={process} />
                <Typography display="inline">{`${i18next.t('processReviewerUpdateNotification.inTheFollowingSteps')} `}</Typography>
            </Grid>

            {Boolean(addedSteps.length) && (
                <Grid>
                    <Typography sx={{ textDecoration: 'underline' }}>
                        {`${i18next.t('processReviewerUpdateNotification.addedToReviewers')}:`}
                    </Typography>
                    {addedSteps.map((step, index) => (
                        <div key={step?._id ?? index}>
                            <StepName step={step} />
                        </div>
                    ))}
                </Grid>
            )}
            {Boolean(deletedSteps.length) && (
                <Grid>
                    <Typography sx={{ textDecoration: 'underline' }}>
                        {`${i18next.t('processReviewerUpdateNotification.removedFromReviewers')}:`}
                    </Typography>
                    {deletedSteps.map((step, index) => (
                        <div key={step?._id ?? index}>
                            <StepName step={step} />
                        </div>
                    ))}
                </Grid>
            )}
        </>
    );
};
