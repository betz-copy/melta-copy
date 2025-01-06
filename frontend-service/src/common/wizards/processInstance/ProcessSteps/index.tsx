/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Box, Divider, Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';
import React from 'react';
import TocIcon from '@mui/icons-material/Toc';
import i18next from 'i18next';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { ProcessStep } from './processStep';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, Status } from '../../../../interfaces/processes/processInstance';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { StepIcon } from '../../../../pages/ProcessInstances/ProcessCard';
import { environment } from '../../../../globals';

export interface ProcessStepValues {
    properties: object;
    attachmentsProperties: object;
    entityReferences: Record<string, IReferencedEntityForProcess>;
    status: Status;
    comments: string;
}

export interface IStepsProp {
    processTemplate: IMongoProcessTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    isStepEditMode: boolean;
    setIsStepEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    onStepUpdateSuccess: (stepInstance: IMongoStepInstancePopulated) => void;
    defaultStepTemplate?: IMongoStepTemplatePopulated;
    setActiveStep: (number) => void;
}

const getStepTemplateByStepInstance = (
    stepInstance: IMongoStepInstancePopulated,
    processTemplate: IMongoProcessTemplatePopulated,
): IMongoStepTemplatePopulated => {
    return processTemplate.steps.find((step) => stepInstance.templateId === step._id)!;
};

const { stepsAmountInStepper } = environment.processInstances;

const getVisibleSteps = (currentStep: number, totalSteps: number) => {
    let startStep = currentStep - Math.floor(stepsAmountInStepper / 2);
    let endStep = currentStep + Math.floor(stepsAmountInStepper / 2) + 1;

    if (startStep < 0) {
        startStep = 0;
        endStep = stepsAmountInStepper;
    }
    if (endStep > totalSteps) {
        endStep = totalSteps;
        startStep = totalSteps - stepsAmountInStepper;
    }

    if (startStep < 0) {
        startStep = 0;
    }

    return { startStep, endStep };
};

const Steps: React.FC<IStepsProp> = ({
    processTemplate,
    processInstance,
    isStepEditMode,
    setIsStepEditMode,
    onStepUpdateSuccess,
    defaultStepTemplate,
    setActiveStep,
}) => {
    const [currStepInstance, setCurrStepInstance] = React.useState(
        defaultStepTemplate ? processInstance.steps.find((step) => step.templateId === defaultStepTemplate._id) : processInstance.steps[0],
    );

    const [currStepInstanceIndex, setCurrStepInstanceIndex] = React.useState(
        defaultStepTemplate ? processInstance.steps.findIndex((step) => step.templateId === defaultStepTemplate._id) : 0,
    );

    return (
        <Grid
            container
            flexDirection="column"
            alignItems="flex-start"
            gap="35px"
            marginTop="15px"
            sx={{
                width: '100%',
                height: '100%',
                paddingRight: '30px',
                paddingLeft: '30px',
            }}
        >
            <Grid container item width="100%" justifyContent="space-between" alignItems="center">
                <Grid item container width="80%">
                    {getVisibleSteps(currStepInstanceIndex, processInstance.steps.length).startStep > 0 && (
                        <Grid item>
                            <a
                                onClick={() => {
                                    if (!isStepEditMode) {
                                        setCurrStepInstance(processInstance.steps[0]);
                                        setCurrStepInstanceIndex(0);
                                    }
                                }}
                                style={{ cursor: !isStepEditMode ? 'pointer' : undefined }}
                            >
                                <Typography fontSize="20px" color="#1E2775">
                                    ￫...
                                </Typography>
                            </a>
                        </Grid>
                    )}
                    <Grid item flexBasis="70%">
                        <Stepper style={{ display: 'flex', flexWrap: 'wrap' }} alternativeLabel>
                            {processInstance.steps
                                .slice(
                                    getVisibleSteps(currStepInstanceIndex, processInstance.steps.length).startStep,
                                    getVisibleSteps(currStepInstanceIndex, processInstance.steps.length).endStep,
                                )
                                .map((stepInstance, index) => (
                                    <Step style={{ minWidth: '75px' }} key={stepInstance._id} active>
                                        <Grid>
                                            <Grid container flexDirection="column" justifyContent="center" width="100%" alignSelf="center" gap="10px">
                                                <StepLabel
                                                    // eslint-disable-next-line react/no-unstable-nested-components
                                                    StepIconComponent={() => {
                                                        return (
                                                            <Grid container flexDirection="column" justifyContent="center" width="100%" gap="10px">
                                                                <StepIcon
                                                                    iconColor={currStepInstance?._id === stepInstance._id ? '#1E2775' : '#9398C2'}
                                                                    step={stepInstance}
                                                                    stepTemplate={
                                                                        processTemplate.steps[
                                                                            index +
                                                                                getVisibleSteps(currStepInstanceIndex, processInstance.steps.length)
                                                                                    .startStep
                                                                        ]
                                                                    }
                                                                    setOpen={() => {
                                                                        if (!isStepEditMode) {
                                                                            setCurrStepInstance(stepInstance);
                                                                            setCurrStepInstanceIndex(
                                                                                index +
                                                                                    getVisibleSteps(
                                                                                        currStepInstanceIndex,
                                                                                        processInstance.steps.length,
                                                                                    ).startStep,
                                                                            );
                                                                        }
                                                                    }}
                                                                    displayTitle={false}
                                                                />
                                                                <Typography
                                                                    color={currStepInstance?._id === stepInstance._id ? '#1E2775' : '#9398C2'}
                                                                    fontSize={currStepInstance?._id === stepInstance._id ? '14px' : '12px'}
                                                                    fontWeight={currStepInstance?._id === stepInstance._id ? '600' : '400'}
                                                                    textAlign="center"
                                                                >
                                                                    {getStepTemplateByStepInstance(stepInstance, processTemplate).displayName}
                                                                </Typography>
                                                            </Grid>
                                                        );
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Step>
                                ))}
                        </Stepper>
                    </Grid>
                    {getVisibleSteps(currStepInstanceIndex, processInstance.steps.length).endStep < processInstance.steps.length && (
                        <Grid item>
                            <a
                                onClick={() => {
                                    if (!isStepEditMode) {
                                        setCurrStepInstance(processInstance.steps[processInstance.steps.length - 1]);
                                        setCurrStepInstanceIndex(processInstance.steps.length - 1);
                                    }
                                }}
                                style={{ cursor: !isStepEditMode ? 'pointer' : undefined }}
                            >
                                <Typography fontSize="20px" marginBottom="25px" color="#1E2775">
                                    ...￩
                                </Typography>
                            </a>
                        </Grid>
                    )}
                </Grid>
                <Grid item container flexDirection="column" width="120px" alignItems="center" gap="10px">
                    <Grid item>
                        <Box
                            sx={{
                                borderRadius: '50%',
                                backgroundColor: '#E0E1ED',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '40px',
                                height: '40px',
                                ':hover': { transform: 'scale(1.1)' },
                                cursor: !isStepEditMode ? 'pointer' : undefined,
                            }}
                            onClick={(e) => {
                                if (!isStepEditMode) setActiveStep(0);
                            }}
                        >
                            <TocIcon sx={{ color: '#1E2775' }} />
                        </Box>
                    </Grid>
                    <Grid item>
                        <Typography color="#1E2775" fontSize="12px" fontWeight="500" textAlign="center">
                            {i18next.t('wizard.processInstance.nextToSummaryDetails')}￩{/* ⬅⇦⇽￩ */}
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Divider variant="middle" sx={{ width: '100%' }} />
            {currStepInstance && (
                <ProcessStep
                    onStepUpdateSuccess={onStepUpdateSuccess}
                    processInstance={processInstance}
                    stepInstance={currStepInstance}
                    stepTemplate={getStepTemplateByStepInstance(currStepInstance, processTemplate)}
                    isStepEditMode={isStepEditMode}
                    setIsStepEditMode={setIsStepEditMode}
                    isThereNextStep={currStepInstanceIndex < processInstance.steps.length - 1}
                    isTherePrevStep={currStepInstanceIndex > 0}
                    onSetNextStep={() => {
                        setCurrStepInstance(processInstance.steps[currStepInstanceIndex + 1]);
                        setCurrStepInstanceIndex(currStepInstanceIndex + 1);
                    }}
                    onSetPrevStep={() => {
                        setCurrStepInstance(processInstance.steps[currStepInstanceIndex - 1]);
                        setCurrStepInstanceIndex(currStepInstanceIndex - 1);
                    }}
                />
            )}
        </Grid>
    );
};

export default Steps;
