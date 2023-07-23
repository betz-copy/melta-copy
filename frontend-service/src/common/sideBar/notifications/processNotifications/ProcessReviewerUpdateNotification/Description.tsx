import React, { useMemo } from 'react';
import { Grid, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { IProcessReviewerUpdateNotificationMetadataPopulated } from '../../../../../interfaces/notifications';
import { IProcessTemplateMap } from '../../../../../interfaces/processes/processTemplate';
import { getStepName } from '../../../../../utils/processes';

export const Description: React.FC<IProcessReviewerUpdateNotificationMetadataPopulated> = ({ process, addedSteps, deletedSteps, unchangedSteps }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const addedStepsNames = useMemo(() => addedSteps.map((step) => getStepName(step.templateId, processTemplatesMap)), [addedSteps]);
    const deletedStepsNames = useMemo(() => deletedSteps.map((step) => getStepName(step.templateId, processTemplatesMap)), [deletedSteps]);

    if (!unchangedSteps.length && !addedSteps.length) {
        return (
            <Grid item>
                <Typography display="inline">{`${i18next.t('processReviewerUpdateNotification.removedFromProcess')} `}</Typography>
                <Typography display="inline" fontWeight="bold">
                    {process.name}
                </Typography>
            </Grid>
        );
    }

    return (
        <>
            <Grid item>
                <Typography display="inline">{`${i18next.t('processReviewerUpdateNotification.inProcess')} `}</Typography>
                <Typography display="inline" fontWeight="bold">
                    {`${process.name} `}
                </Typography>
                <Typography display="inline">{`${i18next.t('processReviewerUpdateNotification.inTheFollowingSteps')} `}</Typography>
            </Grid>

            {Boolean(addedSteps.length) && (
                <Grid item>
                    <Typography sx={{ textDecoration: 'underline' }}>
                        {`${i18next.t('processReviewerUpdateNotification.addedToReviewers')}:`}
                    </Typography>
                    {addedStepsNames.map((stepName) => (
                        <Typography key={stepName} fontWeight="bold">
                            {stepName}
                        </Typography>
                    ))}
                </Grid>
            )}
            {Boolean(deletedSteps.length) && (
                <Grid item>
                    <Typography sx={{ textDecoration: 'underline' }}>
                        {`${i18next.t('processReviewerUpdateNotification.removedFromReviewers')}:`}
                    </Typography>
                    {deletedStepsNames.map((stepName) => (
                        <Typography key={stepName} fontWeight="bold">
                            {stepName}
                        </Typography>
                    ))}
                </Grid>
            )}
        </>
    );
};
