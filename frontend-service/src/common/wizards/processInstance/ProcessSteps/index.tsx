/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Box, Button, Divider, Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import TocIcon from '@mui/icons-material/Toc';
import i18next from 'i18next';
import { History } from '@mui/icons-material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { ProcessStep } from './processStep';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, Status } from '../../../../interfaces/processes/processInstance';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { StepIcon } from '../../../../pages/ProcessInstances/ProcessCard';
import { BlueTitle } from '../../../BlueTitle';
import { MeltaTooltip } from '../../../MeltaTooltip';
import { ActivitiesContent } from '../../../../pages/Entity/components/activityLog/ActivitiesContent';
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

    const [openActivityPopper, setOpenActivityPopper] = React.useState(false);
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const [scrollLeftDisabled, setScrollLeftDisabled] = React.useState(false);
    const [scrollRightDisabled, setScrollRightDisabled] = React.useState(false);

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
        if (containerRef.current) {
            containerRef.current.addEventListener('scroll', updateScrollButtons);
            updateScrollButtons();
        }
        return () => {
            if (containerRef.current) {
                containerRef.current.removeEventListener('scroll', updateScrollButtons);
            }
        };
    }, []);

    const stepperWidth = 488;
    const stepsAmount = 6.5;

    const setScrollByStepIndex = (index: number) => {
        const middleIndex = index - stepsAmount / 2;
        const indexToScroll = middleIndex < 0 ? 0 : middleIndex;

        handleScroll((-indexToScroll / stepsAmount) * stepperWidth - scrollPosition);
    };

    useEffect(() => {
        setScrollByStepIndex(currStepInstanceIndex);
    }, [currStepInstanceIndex]);

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
            <Grid container item width="100%" justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                <Grid item container width="70%">
                    <Grid item width="20px">
                        {!scrollRightDisabled && (
                            <a
                                onClick={() => {
                                    handleScroll(stepperWidth / 2);
                                }}
                                style={{ cursor: !isStepEditMode ? 'pointer' : undefined }}
                            >
                                <ArrowForwardIosIcon
                                    sx={{ color: darkMode ? '#9398c2' : '#1E2775', marginTop: '10px', width: '18px', height: '25px' }}
                                />
                            </a>
                        )}
                    </Grid>
                    <Grid
                        item
                        ref={containerRef}
                        className="scrollable-container"
                        style={{
                            width: `${stepperWidth}px`,
                            height: '90px',
                            overflowX: 'auto',
                            scrollBehavior: 'smooth',
                        }}
                    >
                        <Stepper style={{ display: 'flex', alignItems: 'center' }} alternativeLabel>
                            {processInstance.steps.map((stepInstance, index) => (
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
                    <Grid item width="20px">
                        {!scrollLeftDisabled && (
                            <a
                                onClick={() => {
                                    handleScroll((-1 * stepperWidth) / 2);
                                }}
                                style={{ cursor: !isStepEditMode ? 'pointer' : undefined }}
                            >
                                <ArrowBackIosIcon
                                    sx={{ color: darkMode ? '#9398c2' : '#1E2775', marginTop: '10px', width: '18px', height: '25px' }}
                                />
                            </a>
                        )}
                    </Grid>
                </Grid>
                <Grid item alignSelf="center" width="120px">
                    <MeltaTooltip
                        title={openActivityPopper ? i18next.t('wizard.processInstance.backTo') : i18next.t('entityPage.activityLog.header')}
                    >
                        <Button
                            variant="contained"
                            startIcon={<History />}
                            onClick={() => setOpenActivityPopper((previousOpen) => !previousOpen)}
                            sx={{ marginLeft: '1rem', width: '100px', alignSelf: 'flex-end' }}
                        >
                            {openActivityPopper ? i18next.t('wizard.processInstance.backTo') : i18next.t('entityPage.activityLog.header')}
                        </Button>
                    </MeltaTooltip>
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
                        <BlueTitle
                            style={{ fontSize: '12px', fontWeight: '500', textAlign: 'center' }}
                            title={`${i18next.t('wizard.processInstance.nextToSummaryDetails')}￩`}
                            component="h4"
                            variant="h6"
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Divider variant="middle" sx={{ width: '100%' }} />
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
                <Grid item container direction="column" wrap="nowrap" overflow="none" height="65vh" style={{ overflowY: 'auto' }} padding="20px">
                    <ActivitiesContent
                        activityEntityId={currStepInstance._id}
                        entityTemplate={getStepTemplateByStepInstance(currStepInstance, processTemplate)}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export default Steps;
