import { Close, History } from '@mui/icons-material';
import { Button, Dialog, DialogContent, Grid, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../interfaces/processes/stepTemplate';
import { ActivitiesContent } from '../../../pages/Entity/components/activityLog/ActivitiesContent';
import { deleteProcessRequest, getProcessByIdRequest } from '../../../services/processesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import BlueTitle from '../../MeltaDesigns/BlueTitle';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { ProcessDetailsValues } from './ProcessDetails';
import { useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import GeneralDetails from './ProcessDetails/GeneralDetails';
import StepsReviewers from './ProcessDetails/StepsReviewers';
import ProcessStepsStep from './ProcessSteps/index';
import ProcessSummary from './ProcessSummaryStep/index';

interface IProcessInstanceWizard {
    open: boolean;
    onClose: (wasProcessChanged: boolean) => void;
    processInstance: IMongoProcessInstancePopulated;
    stepTemplate?: IMongoStepTemplatePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    currProcessInstance: IMongoProcessInstancePopulated;
    setCurrProcessInstance: React.Dispatch<React.SetStateAction<IMongoProcessInstancePopulated>>;
    isLoading: any;
    mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
    isProcessChanged: boolean;
    setIsProcessChanged: React.Dispatch<React.SetStateAction<boolean>>;
    isEditMode: boolean;
    setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const wizardContentStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flexDirection: 'row',
        padding: 0,
        overflow: 'hidden',
    },
    content: {
        margin: 0,
        padding: 0,
        flexBasis: '85%',
        display: 'flex',
    },
    stepper: {
        flexBasis: '15%',
        display: 'flex',
    },
}));

const ProcessInstanceWizard: React.FC<IProcessInstanceWizard> = ({
    open,
    onClose,
    processInstance,
    stepTemplate,
    processTemplate,
    currProcessInstance,
    setCurrProcessInstance,
    mutateAsync,
    isProcessChanged,
    setIsProcessChanged,
    isEditMode,
}) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [isStepEditMode, setIsStepEditMode] = useState(false);

    const detailsFormikData = useProcessDetailsFormik(processInstance, processTemplatesMap, mutateAsync);

    const [activeStep, setActiveStep] = useState(stepTemplate ? processTemplate.steps.findIndex((step) => step._id === stepTemplate._id) + 1 : 0);

    const [contentDisplay, setContentDisplay] = useState<'SUMMARY' | 'REVIEWERS'>(environment.processDetailsContentDisplay.summary);

    const classes = wizardContentStyles();

    const handleSubmit = () => {
        if (activeStep === 0) detailsFormikData.submitForm();
    };

    const [deleteDialogState, setDeleteDialogState] = useState<boolean>(false);
    const [areYouSureUpdateDetailsDialog, setAreYouSureUpdateDetailsDialog] = useState<boolean>(false);

    const { mutateAsync: deleteProcessMutate } = useMutation(
        (processId: string) => {
            return deleteProcessRequest(processId);
        },
        {
            onError: (error: AxiosError) => {
                console.error('failed to delete process. error:', error);
                toast.error(i18next.t('processInstancesPage.failedToDeleteProcess'));
            },
            onSuccess: () => {
                toast.success(i18next.t('processInstancesPage.processDeletedSuccessfully'));
            },
        },
    );

    const [openActivityPopper, setOpenActivityPopper] = useState(false);

    return (
        <Dialog
            keepMounted={false}
            open={open}
            fullWidth
            maxWidth="xl"
            slotProps={{
                paper: {
                    style: {
                        height: '85vh',
                        overflowY: 'visible',
                    },
                },
            }}
        >
            <DialogContent dividers className={classes.container}>
                <IconButton
                    aria-label="close"
                    disabled={isEditMode || isStepEditMode}
                    onClick={() => onClose(isProcessChanged)}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Close fontSize="large" />
                </IconButton>
                <Grid container flexDirection="row" height="100%" flexWrap="nowrap" width="100%" size={{ xs: 12 }}>
                    <Grid
                        container
                        height="100%"
                        flexDirection="column"
                        alignItems="center"
                        flexBasis="20%"
                        minWidth="280px"
                        padding={3}
                        style={{
                            backgroundColor: darkMode ? '#171717' : '#F0F2F7',
                            borderBottomLeftRadius: '20px',
                            borderTopLeftRadius: '20px',
                            boxShadow: '10px 10px 15px 10px #888888',
                        }}
                    >
                        <Grid container flexDirection="column" width="100%" height="100%">
                            <Grid height="5%">
                                <MeltaTooltip
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                bgcolor: 'rgba(181, 181, 181, 0.9)',
                                            },
                                        },
                                    }}
                                    title={processInstance.name}
                                >
                                    <BlueTitle
                                        title={processInstance.name}
                                        component="h5"
                                        variant="h5"
                                        style={{
                                            fontWeight: 500,
                                            opacity: 0.9,
                                            maxWidth: '200px',
                                            maxHeight: '200px',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                        }}
                                    />
                                </MeltaTooltip>
                            </Grid>
                            <Grid height="95%">
                                <GeneralDetails
                                    detailsFormikData={detailsFormikData}
                                    processInstance={processInstance}
                                    toPrint={false}
                                    onNext={() => {}}
                                    onBack={() => {}}
                                    key={`${processInstance._id}//${processInstance.name}`}
                                    setContentDisplay={(val) => {
                                        if (val === environment.processDetailsContentDisplay.summary) setActiveStep(0);
                                        setContentDisplay(val);
                                    }}
                                    contentDisplay={contentDisplay}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid container flexBasis="75%" flexDirection="column" padding="15px">
                        {activeStep === 0 && contentDisplay === environment.processDetailsContentDisplay.summary && (
                            <Grid container flexDirection="column" width="100%" height="100%" flexWrap="nowrap">
                                <Grid alignSelf="flex-end" height="50px">
                                    <MeltaTooltip
                                        title={
                                            openActivityPopper
                                                ? i18next.t('wizard.processInstance.backTo')
                                                : i18next.t('entityPage.activityLog.processHeader')
                                        }
                                    >
                                        <Button
                                            variant="outlined"
                                            startIcon={<History />}
                                            onClick={() => setOpenActivityPopper((previousOpen) => !previousOpen)}
                                            sx={{ marginLeft: '1rem', width: '100px', alignSelf: 'flex-end' }}
                                        >
                                            {openActivityPopper
                                                ? i18next.t('wizard.processInstance.backTo')
                                                : i18next.t('entityPage.activityLog.header')}
                                        </Button>
                                    </MeltaTooltip>
                                </Grid>
                                {openActivityPopper && (
                                    <Grid direction="column" wrap="nowrap" overflow="none" height="75vh" style={{ overflowY: 'auto' }} padding="20px">
                                        <ActivitiesContent activityEntityId={processInstance._id} entityTemplate={processTemplate.details} />
                                    </Grid>
                                )}
                                {!openActivityPopper && (
                                    <ProcessSummary
                                        isPrinting={false}
                                        processInstance={currProcessInstance}
                                        processTemplate={processTemplatesMap.get(currProcessInstance.templateId)!}
                                        setActiveStep={setActiveStep}
                                    />
                                )}
                            </Grid>
                        )}
                        {activeStep !== 0 && contentDisplay === environment.processDetailsContentDisplay.summary && (
                            <ProcessStepsStep
                                processTemplate={processTemplate}
                                processInstance={currProcessInstance}
                                onStepUpdateSuccess={async (stepInstance) => {
                                    setCurrProcessInstance((prev) => {
                                        const newSteps = prev.steps;
                                        const updatedStepIndex = newSteps.findIndex((step) => step._id === stepInstance._id);
                                        newSteps[updatedStepIndex] = stepInstance;
                                        return { ...prev, steps: newSteps };
                                    });

                                    const newProcess = await getProcessByIdRequest(processInstance._id);
                                    setCurrProcessInstance(newProcess);
                                    setIsProcessChanged(true);
                                }}
                                isStepEditMode={isStepEditMode}
                                setIsStepEditMode={setIsStepEditMode}
                                defaultStepTemplate={processTemplate.steps[activeStep - 1]}
                                setActiveStep={setActiveStep}
                            />
                        )}
                        {contentDisplay === environment.processDetailsContentDisplay.reviewers && (
                            <StepsReviewers
                                detailsFormikData={detailsFormikData}
                                onBack={() => {}}
                                onNext={() => {}}
                                processInstance={processInstance}
                                isEditMode={false}
                                viewMode
                            />
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <AreYouSureDialog
                open={deleteDialogState}
                handleClose={() => setDeleteDialogState(false)}
                onYes={async () => {
                    await deleteProcessMutate(processInstance._id);
                    setDeleteDialogState(false);
                    onClose(true);
                }}
            />
            <AreYouSureDialog
                open={areYouSureUpdateDetailsDialog}
                handleClose={() => setAreYouSureUpdateDetailsDialog(false)}
                body={i18next.t('processInstancesPage.someStepIsApprovedAreYouSureEditProcessDetails')}
                onYes={() => {
                    setAreYouSureUpdateDetailsDialog(false);
                    handleSubmit();
                }}
            />
        </Dialog>
    );
};

export default ProcessInstanceWizard;
