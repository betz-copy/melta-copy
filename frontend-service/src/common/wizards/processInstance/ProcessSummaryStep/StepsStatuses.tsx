import React from 'react';
import i18next from 'i18next';
import { Grid, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { BlueTitle } from '../../../BlueTitle';
import { getStepTemplateByStepInstance } from '../../../../utils/processWizard/steps';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';

const StepStatus: React.FC<{ stepInstance: IMongoStepInstancePopulated; processTemplate: IMongoProcessTemplatePopulated }> = ({
    stepInstance,
    processTemplate,
}) => {
    return (
        <Grid item container xs={3} direction="column" alignItems="center">
            <Grid item>
                <Tooltip title={i18next.t(`processInstancesPage.stepStatus.${stepInstance.status}`)}>
                    <div>
                        {stepInstance.status === Status.Pending && <AccessTimeFilledIcon color="primary" sx={{ fontSize: 40 }} />}
                        {stepInstance.status === Status.Rejected && <CancelIcon color="error" sx={{ fontSize: 40 }} />}
                        {stepInstance.status === Status.Approved && <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />}
                    </div>
                </Tooltip>
            </Grid>
            <Grid item>
                <Typography textAlign="center">{getStepTemplateByStepInstance(stepInstance, processTemplate).displayName}</Typography>
            </Grid>
        </Grid>
    );
};
const StepsStatuses: React.FC<{ processInstance: IMongoProcessInstancePopulated; processTemplate: IMongoProcessTemplatePopulated }> = ({
    processInstance,
    processTemplate,
}) => {
    return (
        <Grid container direction="column">
            <BlueTitle
                title={i18next.t('wizard.processInstance.summary.subProcessStatus')}
                component="h5"
                variant="h5"
                style={{ fontWeight: 600, opacity: 0.9 }}
            />
            <Grid item container paddingTop="15px" spacing={6} justifyContent="flex-start">
                {processInstance.steps.map((stepInstance, index) => (
                    <StepStatus key={index} processTemplate={processTemplate} stepInstance={stepInstance} />
                ))}
            </Grid>
        </Grid>
    );
};

export default StepsStatuses;
