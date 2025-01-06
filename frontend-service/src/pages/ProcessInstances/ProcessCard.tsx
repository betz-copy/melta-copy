import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    styled,
    IconButton,
    Menu,
    Skeleton,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    stepConnectorClasses,
} from '@mui/material';
import { Edit, ScatterPlotOutlined as HiveIcon, Unarchive } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertSharpIcon from '@mui/icons-material/MoreVertSharp';
import i18next from 'i18next';
import ArchiveIcon from '@mui/icons-material/Archive';
import CircularProgress from '@mui/material/CircularProgress';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { CustomIcon } from '../../common/CustomIcon';
import { IMongoStepTemplatePopulated } from '../../interfaces/processes/stepTemplate';
import { IMongoProcessInstancePopulated, Status } from '../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../interfaces/processes/stepInstance';
import { IProcessTemplateMap } from '../../interfaces/processes/processTemplate';
import ProcessInstanceWizard from '../../common/wizards/processInstance';
import { archiveProcessRequest, deleteProcessRequest, updateProcessRequest } from '../../services/processesService';
import { MenuButton } from '../../common/MenuButton';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { Print } from './print';
import { ProcessDetailsValues } from '../../common/wizards/processInstance/ProcessDetails';
import { ErrorToast } from '../../common/ErrorToast';
import { getFontColor } from '../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import CreateOrEditProcess from '../../common/wizards/processInstance/CreateOrEditProcessDialog';

export enum StatusColors {
    Pending = '#ff8f00',
    Approved = '#2e7d32',
    Rejected = '#d32f2f',
    Archived = '#B0B0B0',
    All = '#0288d1',
}
export enum StatusColorsNames {
    Pending = '#ff8f00',
    Approved = '#1ABC00',
    Rejected = '#d32f2f',
    Archived = '#B0B0B0',
}

export enum StatusFontColors {
    Pending = '#FF9900',
    Approved = '#1ABC00',
    Rejected = '#FF2E00',
    Archived = '#B0B0B0',
}

export enum StatusBackgroundColors {
    Pending = '#FF99001A',
    Approved = '#E0F0DD',
    Rejected = '#F7CDC4',
    Archived = '#B0B0B0',
}

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
    const stageNameRef = React.useRef<any>(null);
    const [isOverflowing, setIsOverflowing] = React.useState(false);

    React.useEffect(() => {
        const stageName = stageNameRef.current;
        if (stageName && stageName.scrollWidth > stageName.clientWidth) {
            setIsOverflowing(true);
        } else {
            setIsOverflowing(false);
        }
    }, []);

    return (
        <MeltaTooltip
            componentsProps={{
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
                        backgroundColor: '#E0E1ED',
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
                {step.status === Status.Approved && <img src="/icons/check-icon.svg" style={{ marginRight: '35px' }} />}
                {step.status === Status.Rejected && <img src="/icons/uncheck-icon.svg" style={{ marginRight: '35px' }} />}
                {displayTitle && (
                    <Typography ref={stageNameRef} noWrap sx={{ maxWidth: '8em', textOverflow: 'ellipsis' }} variant="caption">
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
    setOpen: (x: any) => any,
    stepStatus: Status,
    stepId: string,
) => (
    <Grid container flexDirection="column" justifyContent="center" width="100%" gap="10px">
        <Grid item key={stepId}>
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
    processInstance: IMongoProcessInstancePopulated;
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
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [deleteDialogState, setDeleteDialogState] = useState<boolean>(false);
    const [currProcessInstance, setCurrProcessInstance] = useState<IMongoProcessInstancePopulated>(processInstance);
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
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processInstance.failedToEdit')} />);
                console.log('failed to update process instance. error', error);
            },
        },
    );

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
                    toast.success(i18next.t('processInstancesPage.failedToSendProcessToArchive'));
                } else {
                    console.log('failed to remove process from archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToRemoveProcessFromArchive'));
                }
            },
            onSuccess: (process: IMongoProcessInstancePopulated) => {
                if (process.archived) toast.success(i18next.t('processInstancesPage.processSendToArchiveSuccessfully'));
                else toast.success(i18next.t('processInstancesPage.processRemoveFromArchiveSuccessfully'));
            },
        },
    );

    const StepperConnector = styled(StepConnector)(({ theme }) => ({
        [`& .${stepConnectorClasses.line}`]: {
            height: 2,
            border: 0,
            backgroundColor: getFontColor(processInstance.status),
            borderRadius: 1,
            ...theme.applyStyles('dark', {
                backgroundColor: theme.palette.grey[800],
            }),
        },
    }));

    return (
        <div>
            <StyledCard onClick={() => setOpen({ isOpen: true })}>
                {!isLoading ? (
                    <CardContent>
                        <Grid container direction="column" alignItems="center" justifyContent="center" spacing={1}>
                            <Grid item container direction="row" justifyContent="space-between" alignItems="center" wrap="nowrap" spacing={1}>
                                <Grid container item alignItems="center">
                                    <Grid
                                        item
                                        style={{
                                            height: '20px',
                                            width: '3px',
                                            backgroundColor: statusColorName(processInstance.status, processInstance.archived),
                                            borderRadius: '20px',
                                        }}
                                    />
                                    <Grid item sx={{ paddingLeft: '5px' }}>
                                        <Typography component="h6" variant="h6" noWrap>
                                            {processInstance.name}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Grid item>
                                    {isEditMode && (
                                        <>
                                            <IconButton onClick={handleClick}>
                                                <MoreVertSharpIcon />
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
                                                    icon={isDeleteProcessLoading ? <CircularProgress size={20} /> : <DeleteIcon color="action" />}
                                                />
                                                <MenuButton
                                                    onClick={async (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
                                                        e.stopPropagation();
                                                        await archiveProcessMutate(processInstance);
                                                        onChangedProcessDialogClose(processInstance._id);
                                                        handleCloseMenu(e);
                                                    }}
                                                    text={processInstance.archived ? i18next.t('actions.unArchived') : i18next.t('actions.archived')}
                                                    icon={
                                                        // eslint-disable-next-line no-nested-ternary
                                                        isLodingArchiveProcess ? (
                                                            <CircularProgress size={20} />
                                                        ) : processInstance.archived ? (
                                                            <Unarchive color="action" />
                                                        ) : (
                                                            <ArchiveIcon color="action" />
                                                        )
                                                    }
                                                />
                                                {!processInstance.archived && (
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
                            <Grid item container justifyContent="space-between">
                                <Grid item>
                                    <Typography fontSize="14px" style={{ color: '#787C9E' }} noWrap>
                                        {`${i18next.t('processInstancesPage.process')}: ${
                                            processTemplatesMap.get(currProcessInstance.templateId)!.displayName
                                        }`}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Typography fontSize="14px" style={{ color: '#787C9E' }} noWrap>
                                        {`${new Date(processInstance.startDate).toLocaleDateString('he-IL', {
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit',
                                        })} - ${new Date(processInstance.endDate).toLocaleDateString('he-IL', {
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit',
                                        })}`}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Grid item justifyContent="center" spacing={4}>
                                <Stepper style={{ flexWrap: 'wrap' }} connector={<StepperConnector />} alternativeLabel>
                                    {processInstance.steps.map((step, index) => {
                                        const stepTemplate = processTemplate.steps[index];
                                        return (
                                            <Step style={{ display: 'flex', alignItems: 'center' }} key={step._id}>
                                                <Grid
                                                    container
                                                    flexDirection="column"
                                                    justifyContent="center"
                                                    width="100%"
                                                    alignSelf="center"
                                                    gap="10px"
                                                >
                                                    <StepLabel
                                                        // eslint-disable-next-line react/no-unstable-nested-components
                                                        StepIconComponent={() =>
                                                            StepIconComponent(step, stepTemplate, setOpen, step.status, step._id)
                                                        }
                                                    />
                                                </Grid>
                                            </Step>
                                        );
                                    })}
                                </Stepper>
                            </Grid>
                            <Grid item container justifyContent="space-between">
                                <Grid item>
                                    <Typography fontSize="14px" style={{ color: '#787C9E' }} noWrap>
                                        {`${i18next.t('processInstancesPage.createdBy')}: ---`}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Typography fontSize="14px" style={{ color: '#787C9E' }} noWrap>
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
                            <Grid item container direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                <Grid item>
                                    <Skeleton variant="circular" width={15} height={15} />
                                </Grid>
                                <Grid item>
                                    <Skeleton variant="rectangular" height={20} />
                                </Grid>
                            </Grid>

                            <Grid item container flexWrap="nowrap" justifyContent="center" spacing={4} paddingTop={1} paddingBottom={1}>
                                {processInstance.steps.map(({ _id }) => (
                                    <Grid container item key={_id} alignItems="center" direction="column" spacing={1}>
                                        <Grid item>
                                            <Skeleton variant="circular" width={60} height={60} />
                                        </Grid>
                                        <Grid item>
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
                    await deleteProcessMutate(processInstance._id);
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
                    processInstance={processInstance}
                    mutateAsync={mutateAsync}
                    isEditMode
                />
            )}
        </div>
    );
};

export default ProcessCard;
