import { IProcessStatusUpdateNotificationMetadataPopulated, NotificationType } from '@microservices/shared';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { ProcessName } from './ProcessName';
import { StepName } from './StepName';
import '../../../../css/index.css';
import { environment } from '../../../../globals';
import { NotificationColor } from '../../../notificationColor';

export const ProcessStatusUpdateNotification: React.FC<{
    notificationMetadata: IProcessStatusUpdateNotificationMetadataPopulated;
}> = ({ notificationMetadata: { process, step, status } }) => {
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.processStatusUpdate)?.color;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography display="inline" fontFamily="Rubik" color="primary" fontWeight="bold" paddingLeft="10px">
                    {`${i18next.t('processStatusUpdateNotification.statusUpdate')} 
                    ${i18next.t(`processStatusUpdateNotification.${step !== undefined ? 'step' : 'process'}`)} `}
                </Typography>
            </Grid>
            <Grid>
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
