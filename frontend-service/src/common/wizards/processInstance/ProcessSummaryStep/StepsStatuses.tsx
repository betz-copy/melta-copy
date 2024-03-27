import React, { useState } from 'react';
import i18next from 'i18next';
import { Box, Button, CardContent, Grid, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CardHeader from '@mui/material/CardHeader';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { BlueTitle } from '../../../BlueTitle';
import { getStepTemplateByStepInstance } from '../../../../utils/processWizard/steps';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { getLongDate } from '../../../../utils/date';
import { StatusColorsNames, StyledCard } from '../../../../pages/ProcessInstances/ProcessCard';
import { MeltaTooltip } from '../../../MeltaTooltip';

const StepStatus: React.FC<{
    stepInstance: IMongoStepInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    open: boolean;
    handleClick: () => void;
    isPrinting: boolean;
}> = ({ stepInstance, processTemplate, open, handleClick, isPrinting }) => {
    return (
        <div style={{ paddingTop: '10px' }}>
            <StyledCard
                style={{
                    minHeight: 270,
                    minWidth: !isPrinting ? 235 : undefined,
                    maxWidth: isPrinting ? 200 : undefined,
                    pageBreakInside: 'avoid',
                }}
            >
                <CardHeader
                    title={getStepTemplateByStepInstance(stepInstance, processTemplate).displayName}
                    titleTypographyProps={{ textAlign: 'center', fontWeight: 'bold', variant: 'h6' }}
                />
                <Grid container direction="column">
                    <Grid item>
                        <CardContent>
                            <MeltaTooltip
                                title={i18next.t(`processInstancesPage.stepStatus.${stepInstance.status}`)}
                                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: 5 }}
                            >
                                <div>
                                    {stepInstance.status === Status.Pending && (
                                        <AccessTimeFilledIcon color={StatusColorsNames.Pending} sx={{ fontSize: 35 }} />
                                    )}
                                    {stepInstance.status === Status.Rejected && (
                                        <CancelIcon color={StatusColorsNames.Rejected} sx={{ fontSize: 35 }} />
                                    )}
                                    {stepInstance.status === Status.Approved && (
                                        <CheckCircleIcon color={StatusColorsNames.Approved} sx={{ fontSize: 35 }} />
                                    )}
                                </div>
                            </MeltaTooltip>

                            <>
                                {stepInstance.reviewedAt ? (
                                    <div style={{ paddingBottom: 30 }}>
                                        <Typography textAlign="center" fontSize="14px">
                                            {i18next.t('wizard.processInstance.summary.statusChangedBy')}
                                        </Typography>
                                        <Typography textAlign="center" fontSize="13px">{`${i18next.t(
                                            'wizard.processInstance.summary.onDate',
                                        )}: ${getLongDate(stepInstance.reviewedAt)} `}</Typography>
                                        <Typography textAlign="center" fontSize="15px" fontWeight="bold">{`${i18next.t(
                                            'wizard.processInstance.summary.by',
                                        )}: ${stepInstance.reviewer?.fullName}`}</Typography>
                                    </div>
                                ) : (
                                    <div style={{ paddingBottom: 70 }}>
                                        <Typography textAlign="center" fontWeight="bold">
                                            {i18next.t('wizard.processInstance.summary.StepStatusNotYetBeeUpdated')}
                                        </Typography>
                                    </div>
                                )}
                                <Grid item>
                                    {stepInstance.comments && (
                                        <>
                                            {isPrinting ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    <BlueTitle
                                                        title={i18next.t('wizard.processInstance.step.comment')}
                                                        component="h6"
                                                        variant="body1"
                                                    />
                                                    <Typography fontSize="14px">{stepInstance.comments}</Typography>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            transition: 'all 0.7s ease-in-out',
                                                            maxHeight: open ? '350px' : '0',
                                                            maxWidth: open ? '350px' : '0',
                                                            overflowX: 'hidden',
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        {i18next.t('wizard.processInstance.step.comment')}:
                                                        <Typography gutterBottom component="div" style={{ wordBreak: 'break-word', width: 350 }}>
                                                            {stepInstance.comments}
                                                        </Typography>
                                                    </div>
                                                    <Button
                                                        size="small"
                                                        color="inherit"
                                                        onClick={handleClick}
                                                        startIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowLeftIcon />}
                                                    >
                                                        {!open && i18next.t('wizard.processInstance.step.comment')}
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </Grid>
                            </>
                        </CardContent>
                    </Grid>
                </Grid>
            </StyledCard>
        </div>
    );
};

const StepsStatuses: React.FC<{
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    isPrinting: boolean;
}> = ({ processInstance, processTemplate, isPrinting }) => {
    const [openStep, setOpenStep] = useState(-1);

    // Count the steps by their status
    const pendingSteps = processInstance.steps.filter((step) => step.status === Status.Pending).length;
    const approvedSteps = processInstance.steps.filter((step) => step.status === Status.Approved).length;
    const rejectedSteps = processInstance.steps.filter((step) => step.status === Status.Rejected).length;

    return (
        <>
            <BlueTitle
                title={i18next.t('wizard.processInstance.summary.subProcessStatus')}
                component="h5"
                variant="h5"
                style={{ fontSize: '30px', fontWeight: 600, opacity: 0.9, display: 'flex', justifyContent: 'center', padding: '10px' }}
            />
            <Box display="flex" justifyContent="center" paddingBottom={2}>
                <Typography variant="body1" style={{ margin: '0 10px' }}>{` ${i18next.t(
                    'wizard.processInstance.step.pendingSteps',
                )}: ${pendingSteps}`}</Typography>
                <Typography variant="body1" style={{ margin: '0 10px' }}>{`${i18next.t(
                    'wizard.processInstance.step.approvedSteps',
                )}: ${approvedSteps}`}</Typography>
                <Typography variant="body1" style={{ margin: '0 10px' }}>{`${i18next.t(
                    'wizard.processInstance.step.rejectedSteps',
                )}: ${rejectedSteps}`}</Typography>
            </Box>
            <Box>
                <Grid item container justifyContent="center" flexWrap="wrap" spacing={5} paddingBottom={3}>
                    {processInstance.steps.map((stepInstance, index) => (
                        <Grid item key={stepInstance._id}>
                            <StepStatus
                                processTemplate={processTemplate}
                                stepInstance={stepInstance}
                                open={openStep === index}
                                handleClick={() => setOpenStep(openStep === index ? -1 : index)}
                                isPrinting={isPrinting}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </>
    );
};

export default StepsStatuses;
