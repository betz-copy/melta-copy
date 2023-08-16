import React, { CSSProperties, useState } from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Tooltip, Typography, styled } from '@mui/material';
import { ScatterPlotOutlined as HiveIcon, FiberManualRecordOutlined as StatusIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { CustomIcon } from '../../common/CustomIcon';

import { IMongoStepTemplatePopulated } from '../../interfaces/processes/stepTemplate';
import { IMongoProcessInstancePopulated, Status } from '../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../interfaces/processes/stepInstance';
import { IProcessTemplateMap } from '../../interfaces/processes/processTemplate';
import ProcessInstanceWizard from '../../common/wizards/processInstance';

export enum StatusColors {
    Pending = '#0288d1',
    Approved = '#2e7d32',
    Rejected = '#d32f2f',
}
export enum StatusColorsNames {
    Pending = 'info',
    Approved = 'success',
    Rejected = 'error',
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
        default: {
            return StatusColors.Pending;
        }
    }
};

const statusColorName = (status: Status): StatusColorsNames => {
    switch (status) {
        case Status.Approved: {
            return StatusColorsNames.Approved;
        }
        case Status.Rejected: {
            return StatusColorsNames.Rejected;
        }
        default: {
            return StatusColorsNames.Pending;
        }
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
        <Tooltip
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
        </Tooltip>
    );
};

const ProcessCard: React.FC<{
    processInstance: IMongoProcessInstancePopulated;
    onChangedProcessDialogClose: (processId: string) => void;
    isLoading?: boolean;
}> = ({ processInstance, onChangedProcessDialogClose, isLoading = false }) => {
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

    return (
        <div>
            <StyledCard onClick={() => setOpen({ isOpen: true })}>
                {!isLoading ? (
                    <CardContent>
                        <Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
                            <Grid item container direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                <Grid item>
                                    <StatusIcon fontSize="medium" color={statusColorName(processInstance.status)} />
                                </Grid>
                                <Grid item>
                                    <Typography component="h6" variant="h6" noWrap>
                                        {processInstance.name}
                                    </Typography>
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
                                    <Skeleton variant="rectangular" width="10vh" height={20} />
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

            {open.isOpen && (
                <ProcessInstanceWizard
                    open={open.isOpen}
                    onClose={handleClose}
                    processInstance={processInstance}
                    stepTemplate={open.defaultStepTemplate}
                />
            )}
        </div>
    );
};

export default ProcessCard;
