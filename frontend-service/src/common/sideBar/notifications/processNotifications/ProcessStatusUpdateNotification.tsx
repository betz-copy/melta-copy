import React, { useMemo } from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { IProcessStatusUpdateNotificationMetadataPopulated } from '../../../../interfaces/notifications';
import { IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { getStepName } from '../../../../utils/processes';

export const ProcessStatusUpdateNotification: React.FC<IProcessStatusUpdateNotificationMetadataPopulated> = ({ process, status, step }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const stepName = useMemo(() => (step ? getStepName(step.templateId, processTemplatesMap) : undefined), [step]);

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography display="inline">{`${i18next.t('processStatusUpdateNotification.statusUpdate')} `}</Typography>
                <Typography display="inline">{i18next.t(`processStatusUpdateNotification.${step ? 'step' : 'process'}`)}</Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">
                    {`${i18next.t(`processStatusUpdateNotification.${step ? 'stepStatusPart1' : 'processStatus'}`)} `}
                </Typography>
                {step && (
                    <>
                        <Typography display="inline" fontWeight="bold">
                            {`${stepName} `}
                        </Typography>
                        <Typography display="inline">{`${i18next.t('processStatusUpdateNotification.stepStatusPart2')} `}</Typography>
                    </>
                )}
                <Typography display="inline" fontWeight="bold">
                    {`${process.name} `}
                </Typography>

                <Typography display="inline">{i18next.t('processStatusUpdateNotification.updatedTo')}</Typography>
                <Typography display="inline" fontWeight="bold">
                    {i18next.t(`processInstancesPage.stepStatus.${status}`)}
                </Typography>
            </Grid>
        </Grid>
    );
};
