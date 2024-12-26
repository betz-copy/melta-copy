import { Box, Divider, Grid, Step, StepConnector, stepConnectorClasses, StepIconProps, StepLabel, Stepper, styled, Typography } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import ProcessStatus, { StatusDisplay } from './ProcessStatus';
import StepsStatuses from './StepsStatuses';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { getStepTemplateByStepInstance } from '../../../../utils/processWizard/steps';
import { StepIcon } from '../../../../pages/ProcessInstances/ProcessCard';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';

export interface ProcessSummaryProp {
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    isPrinting: boolean;
    setActiveStep: (number) => void;
}

const StepperConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 80,
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 2,
        border: 0,
        backgroundColor: '#eaeaf0',
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
                // TODO - set active step
                setActiveStep(index + 1);
            }}
            displayTitle={false}
        />
        <Grid item alignSelf="center" width="100%">
            <StatusDisplay status={stepStatus} displayIcon={false} text={i18next.t(`wizard.processInstance.summary.processStatuses.${stepStatus}`)} />
        </Grid>
    </Grid>
);

const ProcessSummary = React.forwardRef<HTMLDivElement, ProcessSummaryProp>(({ processInstance, processTemplate, isPrinting, setActiveStep }) => {
    console.log({ processInstance });
    console.log('insideeee');
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
                <Grid item xs={3}>
                    <ProcessStatus
                        title={i18next.t('wizard.processInstance.summary.processStatus')}
                        instance={processInstance}
                        isPrinting={isPrinting}
                    />
                </Grid>

                <Grid item xs={3} width="100%">
                    <Box sx={{ padding: 3, width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Stepper
                            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
                            connector={<StepperConnector />}
                            alternativeLabel
                        >
                            {processInstance.steps.map((stepInstance, index) => (
                                <Step style={{ minWidth: '175px', height: '170px', display: 'flex', alignItems: 'center' }} key={stepInstance._id}>
                                    <>
                                        <Grid container flexDirection="column" justifyContent="center" width="100%" alignSelf="center" gap="10px">
                                            <Grid item width="100%" alignSelf="center">
                                                <Typography color="#1E2775" fontSize="12px" fontWeight="500" textAlign="center">
                                                    {`${i18next.t('wizard.processTemplate.level')} ${index + 1}: ${
                                                        getStepTemplateByStepInstance(stepInstance, processTemplate).displayName
                                                    }`}
                                                </Typography>
                                            </Grid>
                                            <StepLabel
                                                // StepIconComponent={() => {
                                                //     return (
                                                //         <Grid container flexDirection="column" justifyContent="center" width="100%" gap="10px">
                                                //             <StepIcon
                                                //                 iconColor="#9398C2"
                                                //                 step={stepInstance}
                                                //                 stepTemplate={processTemplate.steps[index]}
                                                //                 setOpen={() => {
                                                //                     // TODO - set active step
                                                //                     setActiveStep(index + 1);
                                                //                 }}
                                                //                 displayTitle={false}
                                                //             />
                                                //             <Grid item alignSelf="center" width="100%">
                                                //                 <StatusDisplay
                                                //                     status={stepInstance.status}
                                                //                     displayIcon={false}
                                                //                     text={i18next.t(
                                                //                         `wizard.processInstance.summary.processStatuses.${stepInstance.status}`,
                                                //                     )}
                                                //                 />
                                                //             </Grid>
                                                //         </Grid>
                                                //     );
                                                // }}
                                                StepIconComponent={() =>
                                                    StepIconComponent(
                                                        stepInstance,
                                                        processTemplate.steps[index],
                                                        setActiveStep,
                                                        index,
                                                        stepInstance.status,
                                                    )
                                                }
                                            />
                                        </Grid>
                                        {/* <Grid>
                                            {index % 5 !== 4 && (
                                                <Grid>
                                                    <Divider style={{ width: '100px' }} />
                                                </Grid>
                                            )}
                                        </Grid> */}
                                        {/* <Grid>
                                            {index === 4 && (
                                                <Divider
                                                    style={{
                                                        top: '50%',
                                                        // height: '300px',
                                                        // width: '600px',
                                                        transform: `translateY(-50%) translateX(${index * 100}px) rotate(${
                                                            (0 % 2 === 0 ? 1 : -1) * 30
                                                        }deg)`,
                                                        left: `calc(50% - ${(index + 1) * 100}px)`,
                                                    }}
                                                />
                                            )}
                                        </Grid> */}
                                    </>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                    {/* <StepsStatuses processInstance={processInstance} processTemplate={processTemplate} isPrinting={isPrinting} /> */}
                </Grid>
            </Grid>
        </Box>
    );
});

export default ProcessSummary;
