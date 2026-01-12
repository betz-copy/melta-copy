import { Archive, Delete, Edit, ScatterPlotOutlined as HiveIcon, MoreVertSharp, Unarchive } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Grid,
    IconButton,
    Menu,
    Skeleton,
    Step,
    StepConnector,
    Stepper,
    stepConnectorClasses,
    styled,
    Typography,
    useTheme,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import {
    IMongoProcessInstanceReviewerPopulated,
    IMongoStepInstancePopulated,
    IMongoStepTemplatePopulated,
    IProcessTemplateMap,
    Status,
    StatusColors,
    StatusColorsNames,
} from '@packages/process';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CustomIcon } from '../../common/CustomIcon';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../common/ErrorToast';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { MenuButton } from '../../common/MenuButton';
import ProcessInstanceWizard from '../../common/wizards/processInstance';
import CreateOrEditProcess from '../../common/wizards/processInstance/CreateOrEditProcessDialog';
import { ProcessDetailsValues } from '../../common/wizards/processInstance/ProcessDetails';
import { getFontColor } from '../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import { archiveProcessRequest, deleteProcessRequest, updateProcessRequest } from '../../services/processesService';
import { Print } from './print';

export const StyledCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'light' ? '#FFFFFF 0% 0% no-repeat padding-box' : undefined,
    boxShadow: '0px 3px 6px #00000029',
    border: theme.palette.mode === 'light' ? '1px solid #DBDBDB' : undefined,
    borderRadius: '8px',
    opacity: '1',
    ':hover': { transform: 'scale(1.02)' },
    cursor: 'pointer',
}));
export const getStatusColor = (status: Status): StatusColors => {
    switch (status) {
        case Status.Approved: {
            return StatusColors.Approved;
        }
        case Status.Rejected: {
            return StatusColors.Rejected;
        }
        case Status.Pending: {
            return StatusColors.Pending;
        }
        default: {
            return StatusColors.Archived;
        }
    }
};

const statusColorName = (status: Status, isArchived?: boolean): StatusColorsNames => {
    if (isArchived) return StatusColorsNames.Archived;

    switch (status) {
        case Status.Approved: {
            return StatusColorsNames.Approved;
        }
        case Status.Rejected: {
            return StatusColorsNames.Rejected;
        }
        default:
            return StatusColorsNames.Pending;
    }
};

export const StepIcon: React.FC<{
    step: IMongoStepInstancePopulated;
    stepTemplate: IMongoStepTemplatePopulated;
    iconColor: string;
    setOpen: React.Dispatch<
        React.SetStateAction<{
            isOpen: boolean;
            defaultStepTemplate?: IMongoStepTemplatePopulated | undefined;
        }>
    >;
    displayTitle?: boolean;
}> = ({ step, stepTemplate, iconColor, setOpen, displayTitle = true }) => {
    const stageNameRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

    useEffect(() => {
        const stageName = stageNameRef.current;
        if (stageName && stageName.scrollWidth > stageName.clientWidth) {
            setIsOverflowing(true);
        } else {
            setIsOverflowing(false);
        }
    }, []);

    return (
        <MeltaTooltip
            slotProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'rgba(181, 181, 181, 0.9)',
                    },
                },
            }}
            title={
                isOverflowing ? (
                    <Grid container direction="column" alignItems="flex-start">
                        <Typography>{stepTemplate.displayName}</Typography>
                    </Grid>
                ) : null
            }
        >
            <Grid container direction="column" alignItems="center">
                <Box
                    sx={{
                        borderRadius: '50%',
                        backgroundColor: '#E6E8F5',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '40px',
                        height: '40px',
                        ':hover': { transform: 'scale(1.1)' },
                        cursor: 'pointer',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen({ isOpen: true, defaultStepTemplate: stepTemplate });
                    }}
                >
                    {stepTemplate.iconFileId ? (
                        <CustomIcon color={iconColor} iconUrl={stepTemplate.iconFileId} width="25px" height="25px" />
                    ) : (
                        <HiveIcon sx={{ color: iconColor }} width="25px" height="25px" />
                    )}
                </Box>
                {step.status === Status.Approved && (
                    <img src="/icons/check-icon.svg" alt="check" style={{ marginRight: '35px', marginTop: '35px', position: 'absolute' }} />
                )}
                {step.status === Status.Rejected && (
                    <img src="/icons/uncheck-icon.svg" alt="uncheck" style={{ marginRight: '35px', marginTop: '35px', position: 'absolute' }} />
                )}
                {displayTitle && (
                    <Typography ref={stageNameRef} noWrap sx={{ maxWidth: '70px', textOverflow: 'ellipsis' }} variant="caption" color="#787C9E">
                        {stepTemplate.displayName}
                    </Typography>
                )}
            </Grid>
        </MeltaTooltip>
    );
};

const StepIconComponent = (
    stepInstance: IMongoStepInstancePopulated,
    stepTemplate: IMongoStepTemplatePopulated,
    setOpen: React.Dispatch<
        React.SetStateAction<{
            isOpen: boolean;
            defaultStepTemplate?: IMongoStepTemplatePopulated;
        }>
    >,
    stepStatus: Status,
    stepId: string,
) => (
    <Grid container flexDirection="column" justifyContent="center" width="100%" gap="10px">
        <Grid key={stepId}>
            <StepIcon
                step={stepInstance}
                stepTemplate={stepTemplate}
                iconColor={stepStatus === Status.Pending ? getStatusColor(stepStatus) : '#787C9E'}
                setOpen={setOpen}
            />
        </Grid>
    </Grid>
);

const ProcessCard: React.FC<{
    processInstance: IMongoProcessInstanceReviewerPopulated;
    onChangedProcessDialogClose: (string) => void;
    isEditMode: boolean;
    isLoading?: boolean;
}> = ({ processInstance, onChangedProcessDialogClose, isLoading = false, isEditMode }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const processTemplate = processTemplatesMap.get(processInstance.templateId)!;

    const [open, setOpen] = useState<{
        isOpen: boolean;
        defaultStepTemplate?: IMongoStepTemplatePopulated;
    }>({ isOpen: false });

    const handleClose = (isProcessChanged: boolean) => {
        setOpen({ isOpen: false });
        if (isProcessChanged) onChangedProcessDialogClose(processInstance._id);
    };
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogState, setDeleteDialogState] = useState<boolean>(false);
    const [currProcessInstance, setCurrProcessInstance] = useState<IMongoProcessInstanceReviewerPopulated>(processInstance);
    const [isProcessChanged, setIsProcessChanged] = useState<boolean>(false);
    const [isEditModeProcess, setIsEditMode] = useState<boolean>(false);

    const handleCloseMenu = (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
        e.stopPropagation();
        setAnchorEl(null);
    };
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const { isLoading: isLoadingUpdate, mutateAsync } = useMutation(
        (processData: ProcessDetailsValues) => updateProcessRequest(processInstance._id, processData, processTemplate),
        {
            onSuccess: (processNewData) => {
                toast.success(i18next.t('wizard.processInstance.editedSuccessfully'));
                setIsProcessChanged(true);
                setIsEditMode(false);
                setCurrProcessInstance(processNewData);
                queryClient.resetQueries({ queryKey: ['searchProcesses'] });
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processInstance.failedToEdit')} />);
                console.error('failed to update process instance. error', error);
            },
        },
    );

    const { mutateAsync: deleteProcessMutate, isLoading: isDeleteProcessLoading } = useMutation(
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
    const { mutateAsync: archiveProcessMutate, isLoading: isLoadingArchiveProcess } = useMutation(
        (process: IMongoProcessInstanceReviewerPopulated) => {
            return archiveProcessRequest(process._id, !process.archived);
        },
        {
            onError: (error: AxiosError, process: IMongoProcessInstanceReviewerPopulated) => {
                if (process.archived) {
                    console.error('failed to send process to archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToSendProcessToArchive'));
                } else {
                    console.error('failed to remove process from archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToRemoveProcessFromArchive'));
                }
            },
            onSuccess: (process: IMongoProcessInstanceReviewerPopulated) => {
                if (process.archived) toast.success(i18next.t('processInstancesPage.processSendToArchiveSuccessfully'));
                else toast.success(i18next.t('processInstancesPage.processRemoveFromArchiveSuccessfully'));
            },
        },
    );

    const StepperConnector = styled(StepConnector)(({ theme }) => ({
        [`& .${stepConnectorClasses.line}`]: {
            marginTop: 7,
            height: 2,
            border: 0,
            backgroundColor: getFontColor(currProcessInstance.status),
            borderRadius: 1,
            ...theme.applyStyles('dark', {
                backgroundColor: theme.palette.grey[800],
            }),
        },
    }));

    const theme = useTheme();

    return (
        <div>
            <StyledCard onClick={() => setOpen({ isOpen: true })}>
                {!isLoading ? (
                    <CardContent>
                        <Grid direction="column" alignItems="center" justifyContent="center" spacing={1}>
                            <Grid container direction="row" justifyContent="space-between" alignItems="center" wrap="nowrap" spacing={1}>
                                <Grid container alignItems="center">
                                    <Grid
                                        sx={{
                                            height: '20px',
                                            width: '3px',
                                            backgroundColor: statusColorName(currProcessInstance.status, currProcessInstance.archived),
                                            borderRadius: '20px',
                                        }}
                                    />
                                    <Grid sx={{ paddingLeft: '5px' }}>
                                        <Typography component="h6" variant="h6" noWrap color={theme.palette.primary.main}>
                                            {currProcessInstance.name}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Grid>
                                    {isEditMode && (
                                        <>
                                            <IconButton onClick={handleClick}>
                                                <MoreVertSharp />
                                            </IconButton>

                                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                                                <MenuButton
                                                    onClick={(e) => {
                                                        setIsEditMode(true);
                                                        e.stopPropagation();
                                                        handleCloseMenu(e);
                                                    }}
                                                    text={i18next.t('actions.edit')}
                                                    icon={<Edit color="action" />}
                                                />
                                                <MenuButton
                                                    onClick={async (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
                                                        e.stopPropagation();
                                                        setDeleteDialogState(true);
                                                    }}
                                                    text={i18next.t('actions.delete')}
                                                    icon={isDeleteProcessLoading ? <CircularProgress size={20} /> : <Delete color="action" />}
                                                />
                                                <MenuButton
                                                    onClick={async (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
                                                        e.stopPropagation();
                                                        await archiveProcessMutate(currProcessInstance);
                                                        onChangedProcessDialogClose(currProcessInstance._id);
                                                        handleCloseMenu(e);
                                                    }}
                                                    text={
                                                        currProcessInstance.archived ? i18next.t('actions.unArchived') : i18next.t('actions.archived')
                                                    }
                                                    icon={
                                                        isLoadingArchiveProcess ? (
                                                            <CircularProgress size={20} />
                                                        ) : currProcessInstance.archived ? (
                                                            <Unarchive color="action" />
                                                        ) : (
                                                            <Archive color="action" />
                                                        )
                                                    }
                                                />
                                                {!currProcessInstance.archived && (
                                                    <Print
                                                        processInstance={currProcessInstance}
                                                        processTemplate={processTemplatesMap.get(currProcessInstance.templateId)!}
                                                        mutateAsync={mutateAsync}
                                                        setCurrProcessInstance={setCurrProcessInstance}
                                                        setIsProcessChanged={setIsProcessChanged}
                                                        isProcessCard
                                                    />
                                                )}
                                            </Menu>
                                        </>
                                    )}
                                </Grid>
                            </Grid>
                            <Grid container justifyContent="space-between">
                                <Grid>
                                    <Typography fontSize="12px" sx={{ color: '#787C9E' }} noWrap>
                                        {`${i18next.t('processInstancesPage.process')}: ${
                                            processTemplatesMap.get(currProcessInstance.templateId)!.displayName
                                        }`}
                                    </Typography>
                                </Grid>
                                <Grid>
                                    <Typography fontSize="12px" sx={{ color: '#787C9E' }} noWrap>
                                        {`${new Date(currProcessInstance.startDate).toLocaleDateString('he-IL', {
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit',
                                        })} - ${new Date(currProcessInstance.endDate).toLocaleDateString('he-IL', {
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit',
                                        })}`}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Grid justifyContent="center">
                                <Stepper sx={{ flexWrap: 'wrap' }} connector={<StepperConnector />} alternativeLabel>
                                    {currProcessInstance.steps.map((step, index) => {
                                        const stepTemplate = processTemplate.steps[index];
                                        return (
                                            <Step sx={{ display: 'flex', alignItems: 'center', width: '85px' }} key={step._id}>
                                                <Grid
                                                    container
                                                    flexDirection="column"
                                                    justifyContent="center"
                                                    width="100%"
                                                    alignSelf="center"
                                                    gap="10px"
                                                >
                                                    <Grid>{StepIconComponent(step, stepTemplate, setOpen, step.status, step._id)}</Grid>
                                                </Grid>
                                            </Step>
                                        );
                                    })}
                                </Stepper>
                            </Grid>
                            <Grid container justifyContent="space-between">
                                <Grid />
                                <Grid>
                                    <Typography fontSize="12px" sx={{ color: '#787C9E' }} noWrap>
                                        {`${i18next.t('processInstancesPage.createdAt')}: ${new Date(processInstance.createdAt).toLocaleDateString(
                                            'he-IL',
                                            {
                                                year: '2-digit',
                                                month: '2-digit',
                                                day: '2-digit',
                                            },
                                        )}`}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CardContent>
                ) : (
                    <CardContent>
                        <Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
                            <Grid container direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                <Grid>
                                    <Skeleton variant="circular" width={15} height={15} />
                                </Grid>
                                <Grid>
                                    <Skeleton variant="rectangular" height={20} />
                                </Grid>
                            </Grid>

                            <Grid container flexWrap="nowrap" justifyContent="center" spacing={4} paddingTop={1} paddingBottom={1}>
                                {currProcessInstance.steps.map(({ _id }) => (
                                    <Grid container key={_id} alignItems="center" direction="column" spacing={1}>
                                        <Grid>
                                            <Skeleton variant="circular" width={60} height={60} />
                                        </Grid>
                                        <Grid>
                                            <Skeleton variant="text" width={30} height={15} />
                                        </Grid>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </CardContent>
                )}
            </StyledCard>

            <AreYouSureDialog
                open={deleteDialogState}
                handleClose={() => setDeleteDialogState(false)}
                onYes={async () => {
                    await deleteProcessMutate(currProcessInstance._id);
                    onChangedProcessDialogClose(null);
                    setDeleteDialogState(false);
                }}
            />
            {open.isOpen && (
                <ProcessInstanceWizard
                    open={open.isOpen}
                    onClose={handleClose}
                    processInstance={processInstance}
                    stepTemplate={open.defaultStepTemplate}
                    processTemplate={processTemplate}
                    currProcessInstance={currProcessInstance}
                    setCurrProcessInstance={setCurrProcessInstance}
                    isLoading={isLoadingUpdate}
                    mutateAsync={mutateAsync}
                    isProcessChanged={isProcessChanged}
                    setIsProcessChanged={setIsProcessChanged}
                    isEditMode={isEditModeProcess}
                    setIsEditMode={setIsEditMode}
                />
            )}
            {isEditModeProcess && processInstance && (
                <CreateOrEditProcess
                    open={isEditModeProcess}
                    onClose={() => setIsEditMode(false)}
                    processInstance={currProcessInstance}
                    mutateAsync={mutateAsync}
                    isEditMode
                />
            )}
        </div>
    );
};

export default ProcessCard;
