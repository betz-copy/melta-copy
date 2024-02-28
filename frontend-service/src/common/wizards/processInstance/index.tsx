import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, CircularProgress, IconButton } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { makeStyles } from '@mui/styles';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import EditIcon from '@mui/icons-material/Edit';
// eslint-disable-next-line import/no-extraneous-dependencies
import _ from 'lodash';
import DeleteIcon from '@mui/icons-material/Delete';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import ArchiveIcon from '@mui/icons-material/Archive';
import { ProcessSideStepper } from './ProcessSideStepper';
import { BlueTitle } from '../../BlueTitle';
import ProcessDetails, { ProcessDetailsValues } from './ProcessDetails';
import { IMongoProcessInstancePopulated, Status } from '../../../interfaces/processes/processInstance';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { getInitialDetailsValues, useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { getProcessByIdRequest, updateProcessRequest, deleteProcessRequest, archiveProcessRequest } from '../../../services/processesService';
import { ErrorToast } from '../../ErrorToast';
import ProcessSummary from './ProcessSummaryStep/index';
import ProcessStepsStep from './ProcessSteps/index';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { IMongoStepTemplatePopulated } from '../../../interfaces/processes/stepTemplate';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { MeltaTooltip } from '../../MeltaTooltip';

interface IProcessInstanceWizard {
    open: boolean;
    onClose: (wasProcessChanged: boolean) => void;
    processInstance: IMongoProcessInstancePopulated;
    stepTemplate?: IMongoStepTemplatePopulated;
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

const ProcessInstanceWizard: React.FC<IProcessInstanceWizard> = ({ open, onClose, processInstance, stepTemplate }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const [currProcessInstance, setCurrProcessInstance] = useState<IMongoProcessInstancePopulated>(processInstance);

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const hasPermissionsToEditDetails = Boolean(myPermissions.processesManagementId);

    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isStepEditMode, setIsStepEditMode] = useState(false);

    const [isProcessChanged, setIsProcessChanged] = useState<boolean>(false);
    const { isLoading, mutateAsync } = useMutation((processData: ProcessDetailsValues) => updateProcessRequest(processInstance._id, processData, stepTemplate), {
        onSuccess: (processNewData) => {
            toast.success(i18next.t('wizard.processInstance.editedSuccessfully'));
            setIsProcessChanged(true);
            setIsEditMode(false);
            setCurrProcessInstance(processNewData);
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processInstance.failedToEdit')} />);
            console.log('failed to update process instance. error', error);
        },
    });
    const detailsFormikData = useProcessDetailsFormik(processInstance, processTemplatesMap, mutateAsync);

    const [activeStep, setActiveStep] = React.useState(stepTemplate ? 1 : 0);

    const classes = wizardContentStyles();

    const nextBthText = i18next.t(activeStep === 0 ? 'wizard.processInstance.nextToSteps' : 'wizard.processInstance.nextToSummaryDetails');
    const steps = [
        {
            label: i18next.t('wizard.processInstance.processDetails'),
            component: <ProcessDetails detailsFormikData={detailsFormikData} isEditMode={isEditMode} processInstance={processInstance} />,
        },
        {
            label: i18next.t('wizard.processInstance.processSteps'),
            component: (
                <ProcessStepsStep
                    processTemplate={processTemplatesMap.get(processInstance!.templateId)!}
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
                    defaultStepTemplate={stepTemplate}
                />
            ),
        },

        {
            label: i18next.t('wizard.processInstance.processSummary'),
            component: (
                <ProcessSummary processInstance={currProcessInstance} processTemplate={processTemplatesMap.get(currProcessInstance.templateId)!} />
            ),
        },
    ];

    const handleNext = () => {
        setActiveStep((prevActiveStep) => (prevActiveStep < steps.length ? prevActiveStep + 1 : prevActiveStep));
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => (prevActiveStep > 0 ? prevActiveStep - 1 : prevActiveStep));
    };

    const handleSubmit = () => {
        if (activeStep === 0) detailsFormikData.submitForm();
    };

    const [deleteDialogState, setDeleteDialogState] = useState<boolean>(false);

    const { mutateAsync: deleteProcessMutate, isLoading: isDeleteProcessLoading } = useMutation(
        (processId: string) => {
            return deleteProcessRequest(processId);
        },
        {
            onError: (error: AxiosError) => {
                console.log('failed to delete process. error:', error);
                toast.error(i18next.t('processInstancesPage.failedToDeleteProcess'));
            },
            onSuccess: () => {
                toast.success(i18next.t('processInstancesPage.processDeletedSuccessfully'));
            },
        },
    );

    const { mutateAsync: archiveProcessMutate, isLoading: isLodingArchiveProcess } = useMutation(
        (process: IMongoProcessInstancePopulated) => {
            return archiveProcessRequest(process._id, !process.archived);
        },
        {
            onError: (error: AxiosError, process: IMongoProcessInstancePopulated) => {
                if (process.archived) {
                    console.log('failed to send process to archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToRemoveProcessFromArchive'));
                } else {
                    console.log('failed to remove process from archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToSendProcessToArchive'));
                }
            },
            onSuccess: (process: IMongoProcessInstancePopulated) => {
                if (process.archived) toast.success(i18next.t('processInstancesPage.processSendToArchiveSuccessfully'));
                else toast.success(i18next.t('processInstancesPage.processRemoveFromArchiveSuccessfully'));
            },
        },
    );

    const processIsEditable =
        hasPermissionsToEditDetails && activeStep === 0 && processInstance.status === Status.Pending && !processInstance.archived;

    return (
        <Dialog keepMounted={false} open={open} fullWidth maxWidth="xl" PaperProps={{ style: { height: '85vh' } }}>
            <DialogTitle height="8vh" margin={0} display="flex" justifyContent="space-between" alignItems="center">
                <BlueTitle title={detailsFormikData.values.name} variant="h4" component="p" />
                <Grid>
                    <Grid container>
                        {isEditMode && activeStep !== 1 && (
                            <Grid container spacing={1}>
                                <Grid item>
                                    <Button
                                        size="large"
                                        variant="outlined"
                                        startIcon={isLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <ClearIcon />}
                                        onClick={() => {
                                            if (activeStep === 0)
                                                detailsFormikData.setValues(getInitialDetailsValues(currProcessInstance, processTemplatesMap));
                                            setIsEditMode(false);
                                        }}
                                    >
                                        {i18next.t('wizard.processInstance.cancelBth')}
                                    </Button>
                                </Grid>
                                <Grid item>
                                    <Button
                                        size="large"
                                        variant="contained"
                                        onClick={() => handleSubmit()}
                                        disabled={!detailsFormikData.dirty || isLoading}
                                        startIcon={isLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />}
                                    >
                                        {i18next.t('wizard.processInstance.saveBth')}
                                    </Button>
                                </Grid>
                            </Grid>
                        )}
                        <Grid>
                            {!isEditMode && hasPermissionsToEditDetails && (
                                <>
                                    {processInstance.archived ? (
                                        <MeltaTooltip title={i18next.t('actions.unArchived')}>
                                            <IconButton
                                                onClick={async () => {
                                                    await archiveProcessMutate(processInstance);
                                                    onClose(true);
                                                }}
                                            >
                                                {isLodingArchiveProcess ? <CircularProgress size={20} /> : <UnarchiveIcon color="primary" />}
                                            </IconButton>
                                        </MeltaTooltip>
                                    ) : (
                                        <MeltaTooltip title={i18next.t('actions.archived')}>
                                            <IconButton
                                                onClick={async () => {
                                                    await archiveProcessMutate(processInstance);
                                                    onClose(true);
                                                }}
                                            >
                                                {isLodingArchiveProcess ? <CircularProgress size={20} /> : <ArchiveIcon color="primary" />}
                                            </IconButton>
                                        </MeltaTooltip>
                                    )}
                                    <MeltaTooltip title={i18next.t('actions.delete')}>
                                        <IconButton onClick={() => setDeleteDialogState(true)}>
                                            {isDeleteProcessLoading ? <CircularProgress size={20} /> : <DeleteIcon color="primary" />}
                                        </IconButton>
                                    </MeltaTooltip>
                                </>
                            )}
                        </Grid>
                        <Grid>
                            {!isEditMode && processIsEditable && (
                                <MeltaTooltip title={i18next.t('wizard.processInstance.editProcessBth')}>
                                    <IconButton onClick={() => setIsEditMode(true)}>
                                        <EditIcon color="primary" />
                                    </IconButton>
                                </MeltaTooltip>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogContent dividers className={classes.container}>
                <Grid className={classes.stepper}>
                    <ProcessSideStepper
                        steps={steps.map((step) => step.label)}
                        activeStep={activeStep}
                        title={isEditMode ? i18next.t('wizard.processInstance.editProcess') : i18next.t('wizard.processInstance.showProcess')}
                    />
                </Grid>
                <Grid className={classes.content}>{steps[activeStep].component}</Grid>
            </DialogContent>
            <DialogActions>
                {activeStep > 0 && (
                    <Button onClick={handleBack} disabled={isEditMode || isStepEditMode}>
                        {i18next.t('processInstancesPage.backBth')}
                    </Button>
                )}
                <Button disabled={isEditMode || isStepEditMode} onClick={() => onClose(isProcessChanged)}>
                    {i18next.t('processInstancesPage.closeBth')}
                </Button>
                {activeStep !== steps.length - 1 && (
                    <Button disabled={isLoading || isEditMode || isStepEditMode} onClick={handleNext}>
                        {nextBthText}
                    </Button>
                )}
            </DialogActions>

            <AreYouSureDialog
                open={deleteDialogState}
                handleClose={() => setDeleteDialogState(false)}
                onYes={async () => {
                    await deleteProcessMutate(processInstance._id);
                    setDeleteDialogState(false);
                    onClose(true);
                }}
            />
        </Dialog>
    );
};

export default ProcessInstanceWizard;
