import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IProcessReviewerUpdateNotificationMetadataPopulated } from '../../../../../interfaces/notifications';
import { Description } from './Description';


export const ProcessReviewerUpdateNotification: React.FC<IProcessReviewerUpdateNotificationMetadataPopulated> = (metadata) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography>
                    {i18next.t('processReviewerUpdateNotification.reviewerUpdate')}
                </Typography>
            </Grid>
            <Description {...metadata} />
        </Grid >
    );
};
