import React, { CSSProperties, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, styled, IconButton, Menu, Skeleton } from '@mui/material';
import { ScatterPlotOutlined as HiveIcon, FiberManualRecordOutlined as StatusIcon, Unarchive } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertSharpIcon from '@mui/icons-material/MoreVertSharp';
import i18next from 'i18next';
import ArchiveIcon from '@mui/icons-material/Archive';
import CircularProgress from '@mui/material/CircularProgress';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import {
    IMongoStepTemplatePopulated,
    IMongoProcessInstanceReviewerPopulated,
    Status,
    IMongoStepInstancePopulated,
    IProcessTemplateMap,
} from '@microservices/shared';
import { CustomIcon } from '../../common/CustomIcon';
import ProcessInstanceWizard from '../../common/wizards/processInstance';
import { archiveProcessRequest, deleteProcessRequest, updateProcessRequest } from '../../services/processesService';
import { MenuButton } from '../../common/MenuButton';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { Print } from './print';
import { ProcessDetailsValues } from '../../common/wizards/processInstance/ProcessDetails';
import { ErrorToast } from '../../common/ErrorToast';

export enum StatusColors {
    Pending = '#ff8f00',
    Approved = '#2e7d32',
    Rejected = '#d32f2f',
    Archived = '#B0B0B0',
    All = '#0288d1',
}
export enum StatusColorsNames {
    Pending = 'warning',
    Approved = 'success',
    Rejected = 'error',
    Archived = 'disabled',
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

const StepIcon: React.FC<{
    step: IMongoStepInstancePopulated;
    stepTemplate: IMongoStepTemplatePopulated;
    iconColor: string;
    setOpen: React.Dispatch<
        React.SetStateAction<{
            isOpen: boolean;
            defaultStepTemplate?: IMongoStepTemplatePopulated | undefined;
        }>
    >;
}> = ({ step, stepTemplate, iconColor, setOpen }) => {
    const color = getStatusColor(step.status);
    const border: CSSProperties['border'] = `2px solid ${color}`;

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
                        border,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '60px',
                        height: '60px',
                        ':hover': { transform: 'scale(1.1)' },
                        cursor: 'pointer',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen({ isOpen: true, defaultStepTemplate: stepTemplate });
                    }}
                >
                    {stepTemplate.iconFileId ? (
                        <CustomIcon color={iconColor} iconUrl={stepTemplate.iconFileId} width="40px" height="40px" />
                    ) : (
                        <HiveIcon sx={{ color: iconColor }} fontSize="large" />
                    )}
                </Box>
                <Typography ref={stageNameRef} noWrap sx={{ maxWidth: '8em', textOverflow: 'ellipsis' }} variant="caption">
                    {stepTemplate.displayName}
                </Typography>
            </Grid>
        </MeltaTooltip>
    );
};

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
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
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
        (process: IMongoProcessInstanceReviewerPopulated) => {
            return archiveProcessRequest(process._id, !process.archived);
        },
        {
            onError: (error: AxiosError, process: IMongoProcessInstanceReviewerPopulated) => {
                if (process.archived) {
                    console.log('failed to send process to archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToSendProcessToArchive'));
                } else {
                    console.log('failed to remove process from archive. error:', error);
                    toast.success(i18next.t('processInstancesPage.failedToRemoveProcessFromArchive'));
                }
            },
            onSuccess: (process: IMongoProcessInstanceReviewerPopulated) => {
                if (process.archived) toast.success(i18next.t('processInstancesPage.processSendToArchiveSuccessfully'));
                else toast.success(i18next.t('processInstancesPage.processRemoveFromArchiveSuccessfully'));
            },
        },
    );

    return (
        <div>
            <StyledCard onClick={() => setOpen({ isOpen: true })}>
                {!isLoading ? (
                    <CardContent>
                        <Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
                            <Grid item container direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                <Grid item>
                                    <StatusIcon fontSize="medium" color={statusColorName(processInstance.status, processInstance.archived)} />
                                </Grid>
                                <Grid item>
                                    <Typography component="h6" variant="h6" noWrap>
                                        {processInstance.name}
                                    </Typography>
                                </Grid>
                                <Grid>
                                    {isEditMode && (
                                        <>
                                            <IconButton onClick={handleClick}>
                                                <MoreVertSharpIcon />
                                            </IconButton>

                                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
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
                            <Grid item container justifyContent="center" spacing={4}>
                                {processInstance.steps.map((step, index) => {
                                    const stepTemplate = processTemplate.steps[index];
                                    return (
                                        <Grid item key={stepTemplate.name}>
                                            <StepIcon
                                                step={step}
                                                stepTemplate={stepTemplate}
                                                iconColor={getStatusColor(step.status)}
                                                setOpen={setOpen}
                                            />
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Grid>
                    </CardContent>
                ) : (
                    <CardContent>
                        <Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
                            {/* Status & Process Name */}
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
        </div>
    );
};

export default ProcessCard;
