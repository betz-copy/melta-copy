/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Box, Divider, Grid, Step, StepLabel, Stepper, Typography, useTheme } from '@mui/material';
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

const getVisibleSteps = (currentStep: number, totalSteps: number) => {
    const visibleSteps = 5;
    let startStep = currentStep - Math.floor(visibleSteps / 2);
    let endStep = currentStep + Math.floor(visibleSteps / 2) + 1;

    if (startStep < 0) {
        startStep = 0;
        endStep = visibleSteps;
    }
    if (endStep > totalSteps) {
        endStep = totalSteps;
        startStep = totalSteps - visibleSteps;
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
    // const [tabValue, setTabValue] = React.useState(defaultStepTemplate ? defaultStepTemplate._id : processTemplate.steps[0]._id);
    const [currStepInstance, setCurrStepInstance] = React.useState(
        defaultStepTemplate ? processInstance.steps.find((step) => step.templateId === defaultStepTemplate._id) : processInstance.steps[0],
    );

    const [currStepInstanceIndex, setCurrStepInstanceIndex] = React.useState(
        defaultStepTemplate ? processInstance.steps.findIndex((step) => step.templateId === defaultStepTemplate._id) : 0,
    );

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();
    const defaultTabColor = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

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
            {/* <TabContext value={tabValue}>
                <Grid container direction="column">
                    <Grid item container sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={(_event, newValue) => setTabValue(newValue)} scrollButtons="auto" variant="scrollable">
                            {processTemplate.steps?.map(({ _id, displayName, iconFileId }) => (
                                <Tab
                                    icon={
                                        iconFileId ? (
                                            <CustomIcon
                                                color={_id === tabValue ? theme.palette.primary.main : defaultTabColor}
                                                iconUrl={iconFileId}
                                                width="25px"
                                                height="25px"
                                                style={{ marginLeft: 5 }}
                                            />
                                        ) : (
                                            <HiveIcon />
                                        )
                                    }
                                    iconPosition="start"
                                    key={_id}
                                    label={displayName}
                                    value={_id}
                                    disabled={tabValue !== _id && isStepEditMode}
                                    wrapped
                                />
                            ))}
                        </TabList>
                    </Grid>
                    <Grid item>
                        {processInstance.steps.map((stepInstance) => {
                            const stepTemplate = getStepTemplateByStepInstance(stepInstance, processTemplate);
                            return (
                                <TabPanel key={stepInstance._id} value={stepTemplate._id}>
                                    <ProcessStep
                                        onStepUpdateSuccess={onStepUpdateSuccess}
                                        processInstance={processInstance}
                                        stepInstance={stepInstance}
                                        stepTemplate={stepTemplate}
                                        isStepEditMode={isStepEditMode}
                                        setIsStepEditMode={setIsStepEditMode}
                                    />
                                </TabPanel>
                            );
                        })}
                    </Grid>
                </Grid>
            </TabContext> */}
            <Grid container item width="100%" justifyContent="space-between" alignItems="center">
                <Grid item container width="80%">
                    {getVisibleSteps(currStepInstanceIndex, processInstance.steps.length).startStep > 0 && (
                        <Grid item>
                            <a
                                onClick={() => {
                                    setCurrStepInstance(processInstance.steps[0]);
                                    setCurrStepInstanceIndex(0);
                                }}
                                style={{ cursor: 'pointer' }}
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
                                                            <Grid
                                                                container
                                                                flexDirection="column"
                                                                justifyContent="center"
                                                                width="100%"
                                                                gap="10px"
                                                                // onClick={() => {
                                                                //     console.log('change stepppp');
                                                                //     setCurrStepInstance(stepInstance);
                                                                // }}
                                                            >
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
                                                                        setCurrStepInstance(stepInstance);
                                                                        setCurrStepInstanceIndex(
                                                                            index +
                                                                                getVisibleSteps(currStepInstanceIndex, processInstance.steps.length)
                                                                                    .startStep,
                                                                        );
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
                                    setCurrStepInstance(processInstance.steps[processInstance.steps.length - 1]);
                                    setCurrStepInstanceIndex(processInstance.steps.length - 1);
                                }}
                                style={{ cursor: 'pointer' }}
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
                                // border,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '40px',
                                height: '40px',
                                ':hover': { transform: 'scale(1.1)' },
                                cursor: 'pointer',
                            }}
                            onClick={(e) => {
                                // e.stopPropagation();
                                setActiveStep(0);
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
                        console.log('nexttt');
                        setCurrStepInstance(processInstance.steps[currStepInstanceIndex + 1]);
                        setCurrStepInstanceIndex(currStepInstanceIndex + 1);
                    }}
                    onSetPrevStep={() => {
                        console.log('prevvvv');
                        setCurrStepInstance(processInstance.steps[currStepInstanceIndex - 1]);
                        setCurrStepInstanceIndex(currStepInstanceIndex - 1);
                    }}
                />
            )}
        </Grid>
    );
};

export default Steps;
