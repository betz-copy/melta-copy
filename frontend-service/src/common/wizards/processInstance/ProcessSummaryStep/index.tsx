import { Box, Grid, Step, StepConnector, Stepper, stepConnectorClasses, styled } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { StepIcon } from '../../../../pages/ProcessInstances/ProcessCard';
import { getStepTemplateByStepInstance } from '../../../../utils/processWizard/steps';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';
import { CommentsDetails } from '../ProcessSteps/processStep';
import ProcessStatus, { ReviewedAtProcessStatus, StatusDisplay } from './ProcessStatus';

export interface ProcessSummaryProp {
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    isPrinting: boolean;
    setActiveStep: (stepIndex: number) => void;
}

const StepperConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 80,
    },
    [`& .${stepConnectorClasses.line}`]: {
        marginTop: 15,
        border: '1px dashed #eaeaf0',
        borderRadius: 1,
        ...theme.applyStyles('dark', {
            backgroundColor: theme.palette.grey[800],
        }),
    },
}));

const StepIconComponent = (
    stepInstance: IMongoStepInstancePopulated,
    stepTemplate: IMongoStepTemplatePopulated,
    setActiveStep: (val: number) => void,
    index: number,
    stepStatus: Status,
) => (
    <Grid container flexDirection="column" justifyContent="center" width="100%" gap="10px">
        <StepIcon
            iconColor="#9398C2"
            step={stepInstance}
            stepTemplate={stepTemplate}
            setOpen={() => {
                setActiveStep(index + 1);
            }}
            displayTitle={false}
        />
        <Grid alignSelf="center" width="100%">
            <StatusDisplay status={stepStatus} displayIcon={false} text={i18next.t(`wizard.processInstance.summary.processStatuses.${stepStatus}`)} />
        </Grid>
    </Grid>
);

const ProcessSummary: React.FC<ProcessSummaryProp> = ({ processInstance, processTemplate, isPrinting, setActiveStep }) => {
    return (
        <Box
            sx={{
                width: '100%',
                paddingX: '30px',
                paddingTop: isPrinting ? '30px' : undefined,
                overflowY: isPrinting ? 'visible' : 'auto',
            }}
            style={{ direction: 'rtl' }}
        >
            <Grid container alignItems="space-around" direction="column" width="100%">
                <Grid size={{ xs: 3 }}>
                    <ProcessStatus
                        title={i18next.t('wizard.processInstance.summary.processStatus')}
                        instance={processInstance}
                        isPrinting={isPrinting}
                    />
                </Grid>

                <Grid size={{ xs: 3 }} width="100%">
                    <Box sx={{ padding: 3, width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Stepper sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }} connector={<StepperConnector />} alternativeLabel>
                            {processInstance.steps.map((stepInstance, index) => (
                                <Step sx={{ minWidth: '175px', height: '200px', display: 'flex', alignItems: 'center' }} key={stepInstance._id}>
                                    <Grid
                                        container
                                        flexDirection="column"
                                        justifyContent="center"
                                        width="100%"
                                        alignSelf="center"
                                        alignItems="center"
                                        gap="10px"
                                    >
                                        <Grid width="100%" alignSelf="center">
                                            <BlueTitle
                                                style={{ fontSize: '12px', fontWeight: '500', textAlign: 'center' }}
                                                component="h4"
                                                variant="h6"
                                                title={`${i18next.t('wizard.processTemplate.level')} ${index + 1}: ${
                                                    getStepTemplateByStepInstance(stepInstance, processTemplate).displayName
                                                }`}
                                            />
                                        </Grid>
                                        <Grid>
                                            {StepIconComponent(stepInstance, processTemplate.steps[index], setActiveStep, index, stepInstance.status)}
                                        </Grid>
                                        <Grid container position="absolute" top="165px" alignItems="center" justifyContent="center">
                                            <Grid>
                                                <ReviewedAtProcessStatus instance={stepInstance} />
                                            </Grid>
                                            {stepInstance.comments && (
                                                <Grid>
                                                    <MeltaTooltip title={<CommentsDetails values={stepInstance} />}>
                                                        <Grid>
                                                            <img src="/icons/comment-icon.svg" />
                                                        </Grid>
                                                    </MeltaTooltip>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProcessSummary;
