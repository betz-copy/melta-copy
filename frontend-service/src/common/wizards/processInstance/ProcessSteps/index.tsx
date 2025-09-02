/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { ArrowBackIos, ArrowForwardIos, History, Toc } from '@mui/icons-material';
import { Box, Button, Divider, Grid, Step, StepConnector, stepConnectorClasses, Stepper, styled, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { ActivitiesContent } from '../../../../pages/Entity/components/activityLog/ActivitiesContent';
import { StepIcon } from '../../../../pages/ProcessInstances/ProcessCard';
import { useDarkModeStore } from '../../../../stores/darkMode';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';
import { ProcessStep } from './processStep';
import './processStep.css';

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

const StepperConnector = styled(StepConnector)(() => ({
    [`& .${stepConnectorClasses.line}`]: {
        marginTop: 7,
    },
}));

const Steps: React.FC<IStepsProp> = ({
    processTemplate,
    processInstance,
    isStepEditMode,
    setIsStepEditMode,
    onStepUpdateSuccess,
    defaultStepTemplate,
    setActiveStep,
}) => {
    const [currStepInstance, setCurrStepInstance] = useState(
        defaultStepTemplate ? processInstance.steps.find((step) => step.templateId === defaultStepTemplate._id) : processInstance.steps[0],
    );

    const [currStepInstanceIndex, setCurrStepInstanceIndex] = useState(
        defaultStepTemplate ? processInstance.steps.findIndex((step) => step.templateId === defaultStepTemplate._id) : 0,
    );

    const [openActivityPopper, setOpenActivityPopper] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [scrollLeftDisabled, setScrollLeftDisabled] = useState(false);
    const [scrollRightDisabled, setScrollRightDisabled] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const containerRef = useRef<HTMLDivElement | null>(null);

    const updateScrollButtons = () => {
        if (containerRef.current) {
            const maxScrollLeft = containerRef.current.scrollWidth - containerRef.current.clientWidth || 0;
            setScrollPosition(containerRef.current.scrollLeft);
            setScrollLeftDisabled(-1 * containerRef.current.scrollLeft >= maxScrollLeft);
            setScrollRightDisabled(containerRef.current.scrollLeft === 0);
        }
    };

    const handleScroll = (scrollAmount: number) => {
        if (containerRef.current) {
            const newScrollPosition = scrollPosition + scrollAmount;
            const maxScrollLeft = containerRef.current.scrollWidth - containerRef.current.clientWidth;

            if (newScrollPosition < 0 && newScrollPosition > maxScrollLeft * -1) setScrollPosition(newScrollPosition);

            containerRef.current.scrollLeft = newScrollPosition;

            updateScrollButtons();
        }
    };

    useEffect(() => {
        const container = containerRef.current;

        if (container) {
            container.addEventListener('scroll', updateScrollButtons);
            updateScrollButtons();
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', updateScrollButtons);
            }
        };
    }, []);

    const stepperWidth = 640;
    const stepsAmount = 6.5;

    const setScrollByStepIndex = (index: number) => {
        const middleIndex = index - stepsAmount / 2;
        const indexToScroll = middleIndex < 0 ? 0 : middleIndex;

        handleScroll((-indexToScroll / stepsAmount) * stepperWidth - scrollPosition);
    };

    useEffect(() => {
        setScrollByStepIndex(currStepInstanceIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currStepInstanceIndex]);

    return (
        <Grid
            container
            flexDirection="column"
            marginTop="15px"
            flexWrap="nowrap"
            gap="35px"
            sx={{
                width: '100%',
                height: '100%',
                paddingRight: '30px',
                paddingLeft: '30px',
            }}
        >
            <Grid
                container
                flexDirection="column"
                alignItems="flex-start"
                gap="35px"
                flexWrap="nowrap"
                sx={{
                    width: '100%',
                }}
            >
                <Grid container width="100%" justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                    <Grid container width="70%" minWidth="680px">
                        <Grid width="20px">
                            {!scrollRightDisabled && (
                                <a
                                    onClick={() => {
                                        handleScroll(stepperWidth / 2);
                                    }}
                                    style={{ cursor: !isStepEditMode ? 'pointer' : undefined }}
                                >
                                    <ArrowForwardIos
                                        sx={{ color: darkMode ? '#9398c2' : '#1E2775', marginTop: '10px', width: '18px', height: '25px' }}
                                    />
                                </a>
                            )}
                        </Grid>
                        <Grid
                            ref={containerRef}
                            className="scrollable-container"
                            style={{
                                width: `${stepperWidth}px`,
                                height: '90px',
                                overflowX: 'auto',
                                scrollBehavior: 'smooth',
                            }}
                            paddingTop="5px"
                        >
                            <Stepper sx={{ display: 'flex', alignItems: 'center' }} connector={<StepperConnector />} alternativeLabel>
                                {processInstance.steps.map((stepInstance, index) => (
                                    <Step sx={{ minWidth: '100px' }} key={stepInstance._id} active>
                                        <Grid>
                                            <Grid container flexDirection="column" justifyContent="center" width="100%" alignSelf="center" gap="10px">
                                                <MeltaTooltip
                                                    slotProps={{
                                                        tooltip: {
                                                            sx: {
                                                                bgcolor: 'rgba(181, 181, 181, 0.9)',
                                                            },
                                                        },
                                                    }}
                                                    title={
                                                        <Grid container direction="column" alignItems="flex-start">
                                                            <Typography>
                                                                {getStepTemplateByStepInstance(stepInstance, processTemplate).displayName}
                                                            </Typography>
                                                        </Grid>
                                                    }
                                                >
                                                    <Grid
                                                        container
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        width="100%"
                                                        gap="10px"
                                                    >
                                                        <StepIcon
                                                            iconColor={currStepInstance?._id === stepInstance._id ? '#1E2775' : '#9398C2'}
                                                            step={stepInstance}
                                                            stepTemplate={processTemplate.steps[index]}
                                                            setOpen={() => {
                                                                if (!isStepEditMode) {
                                                                    setCurrStepInstance(stepInstance);
                                                                    setCurrStepInstanceIndex(index);
                                                                }
                                                            }}
                                                            displayTitle={false}
                                                        />

                                                        <Typography
                                                            color={
                                                                // eslint-disable-next-line no-nested-ternary
                                                                currStepInstance?._id === stepInstance._id
                                                                    ? darkMode
                                                                        ? '#b7bef7'
                                                                        : '#1E2775'
                                                                    : '#9398C2'
                                                            }
                                                            noWrap
                                                            sx={{ maxWidth: '70px', textOverflow: 'ellipsis' }}
                                                            fontSize={currStepInstance?._id === stepInstance._id ? '14px' : '12px'}
                                                            fontWeight={currStepInstance?._id === stepInstance._id ? '600' : '400'}
                                                            textAlign="center"
                                                        >
                                                            {getStepTemplateByStepInstance(stepInstance, processTemplate).displayName}
                                                        </Typography>
                                                    </Grid>
                                                </MeltaTooltip>
                                            </Grid>
                                        </Grid>
                                    </Step>
                                ))}
                            </Stepper>
                        </Grid>
                        <Grid width="20px">
                            {!scrollLeftDisabled && (
                                <a
                                    onClick={() => {
                                        handleScroll((-1 * stepperWidth) / 2);
                                    }}
                                    style={{ cursor: !isStepEditMode ? 'pointer' : undefined }}
                                >
                                    <ArrowBackIos
                                        sx={{ color: darkMode ? '#9398c2' : '#1E2775', marginTop: '10px', width: '18px', height: '25px' }}
                                    />
                                </a>
                            )}
                        </Grid>
                    </Grid>
                    <Grid container justifyContent="flex-end" alignItems="flex-start">
                        <Grid container flexDirection="column" width="120px" alignItems="center" gap="10px">
                            <Grid>
                                <Box
                                    sx={{
                                        borderRadius: '50%',
                                        backgroundColor: '#E0E1ED',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: '40px',
                                        height: '40px',
                                        ':hover': { transform: !isStepEditMode ? 'scale(1.1)' : undefined },
                                        cursor: !isStepEditMode ? 'pointer' : undefined,
                                    }}
                                    onClick={(_e) => {
                                        if (!isStepEditMode) setActiveStep(0);
                                    }}
                                >
                                    <Toc sx={{ color: '#1E2775' }} />
                                </Box>
                            </Grid>
                            <Grid>
                                <BlueTitle
                                    style={{ fontSize: '12px', fontWeight: '500', textAlign: 'center' }}
                                    title={`${i18next.t('wizard.processInstance.nextToSummaryDetails')}`}
                                    component="h4"
                                    variant="h6"
                                />
                            </Grid>
                        </Grid>
                        <Grid alignSelf="flex-start" width="120px" marginTop="2px">
                            <MeltaTooltip
                                title={
                                    openActivityPopper ? i18next.t('wizard.processInstance.backTo') : i18next.t('entityPage.activityLog.stepHeader')
                                }
                            >
                                <Button
                                    variant="outlined"
                                    startIcon={<History />}
                                    onClick={() => setOpenActivityPopper((previousOpen) => !previousOpen)}
                                    sx={{ marginLeft: '1rem', width: '100px', alignSelf: 'flex-end' }}
                                >
                                    {openActivityPopper ? i18next.t('wizard.processInstance.backTo') : i18next.t('entityPage.activityLog.header')}
                                </Button>
                            </MeltaTooltip>
                        </Grid>
                    </Grid>
                </Grid>
                <Divider variant="middle" sx={{ width: '100%' }} />
            </Grid>
            <Grid
                height="100%"
                sx={{
                    overflowY: 'auto',
                }}
            >
                {currStepInstance && !openActivityPopper && (
                    <ProcessStep
                        onStepUpdateSuccess={(stepInstance: IMongoStepInstancePopulated) => {
                            setCurrStepInstance(stepInstance);
                            onStepUpdateSuccess(stepInstance);
                        }}
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
                {currStepInstance && openActivityPopper && (
                    <Grid container direction="column" wrap="nowrap" overflow="none" height="65vh" style={{ overflowY: 'auto' }} padding="20px">
                        <ActivitiesContent
                            activityEntityId={currStepInstance._id}
                            entityTemplate={getStepTemplateByStepInstance(currStepInstance, processTemplate)}
                        />
                    </Grid>
                )}
            </Grid>
        </Grid>
    );
};

export default Steps;
