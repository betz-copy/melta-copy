import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IProcessStatusUpdateNotificationMetadataPopulated } from '../../../../interfaces/notifications';
import { ProcessName } from './ProcessName';
import { StepName } from './StepName';

export const ProcessStatusUpdateNotification: React.FC<IProcessStatusUpdateNotificationMetadataPopulated> = ({ process, step, status }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography display="inline">{`${i18next.t('processStatusUpdateNotification.statusUpdate')} `}</Typography>
                <Typography display="inline">{i18next.t(`processStatusUpdateNotification.${step !== undefined ? 'step' : 'process'}`)}</Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">
                    {`${i18next.t(`processStatusUpdateNotification.${step !== undefined ? 'stepStatusPart1' : 'processStatus'}`)} `}
                </Typography>
                {step !== undefined && (
                    <>
                        <StepName step={step} />
                        <Typography display="inline">{`${i18next.t('processStatusUpdateNotification.stepStatusPart2')} `}</Typography>
                    </>
                )}
                <ProcessName process={process} />
                <Typography display="inline">{i18next.t('processStatusUpdateNotification.updatedTo')}</Typography>
                <Typography display="inline" fontWeight="bold">
                    {i18next.t(`processInstancesPage.stepStatus.${status}`)}
                </Typography>
            </Grid>
        </Grid>
    );
};
