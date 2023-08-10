import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, CircularProgress } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { makeStyles } from '@mui/styles';
import { useMutation, useQueryClient } from 'react-query';
import { ProcessSideStepper } from './ProcessSideStepper';
import { BlueTitle } from '../../BlueTitle';
import ProcessDetails, { ProcessDetailsValues } from './ProcessDetails';
import { IMongoProcessInstancePopulated, Status } from '../../../interfaces/processes/processInstance';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { getInitialDetailsValues, useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import ProcessSummary from './ProcessSummaryStep/index';
import { getProcessByIdRequest, updateProcessRequest } from '../../../services/processesService';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { ErrorToast } from '../../ErrorToast';
import EditIcon from '@mui/icons-material/Edit';
import _ from 'lodash';
import ProcessStepsStep from './ProcessSteps/index';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { IMongoStepTemplatePopulated } from '../../../interfaces/processes/stepTemplate';

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
    const hasPermissionsToEditDetailsAndSummary = Boolean(myPermissions.processesManagementId);

    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isStepEditMode, setIsStepEditMode] = useState(false);

    const [isProcessChanged, setIsProcessChanged] = useState<boolean>(false);
    const { isLoading, mutateAsync } = useMutation(
        (processData: ProcessDetailsValues ) => updateProcessRequest(processInstance._id, processData),
        {
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
        },
    );
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

    return (
        <Dialog keepMounted={false} open={open} fullWidth maxWidth="xl" PaperProps={{ style: { height: '85vh' } }}>
            <DialogTitle height="8vh" margin={0} display="flex" justifyContent="space-between" alignItems="center">
                <BlueTitle title={detailsFormikData.values.name} variant="h4" component="p" />
                <Grid>
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

                    {!isEditMode && hasPermissionsToEditDetailsAndSummary && activeStep === 0 && processInstance.status === Status.Pending && (
                        <Button variant="contained" size="large" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                            {i18next.t('wizard.processInstance.editProcessBth')}
                        </Button>
                    )}
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
        </Dialog>
    );
};

export default ProcessInstanceWizard;
