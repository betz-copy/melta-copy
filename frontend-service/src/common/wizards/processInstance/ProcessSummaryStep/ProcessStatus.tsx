import {
    AccessTimeFilled as AccessTimeFilledIcon,
    Cancel as CancelIcon,
    CancelOutlined as CancelOutlinedIcon,
    CheckCircle as CheckCircleIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
} from '@mui/icons-material';
import { Grid, IconButton, SvgIconProps, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { StatusColorsNames } from '../../../../pages/ProcessInstances/ProcessCard';
import { useUserStore } from '../../../../stores/user';
import { getLongDate } from '../../../../utils/date';
import { BlueTitle } from '../../../BlueTitle';
import { ProcessStepValues } from '../ProcessSteps/index';

interface StatusDisplayProps {
    status: Status;
    Icon: React.ComponentType<SvgIconProps>;
    text: string;
    fontSize?: number;
}

export const getColor = (status: Status) => {
    switch (status) {
        case Status.Approved:
            return StatusColorsNames.Approved;
        case Status.Rejected:
            return StatusColorsNames.Rejected;
        default:
            return StatusColorsNames.Pending;
    }
};
interface StatusButtonProps extends StatusDisplayProps {
    currentStatus: Status;
    handleClick: () => void;
    IconOutlined: React.ComponentType<SvgIconProps>;
}
const StatusButton: React.FC<StatusButtonProps> = ({ status, currentStatus, handleClick, Icon, IconOutlined, text }) => {
    const color = getColor(status);
    return (
        <Grid item>
            <Grid container direction="column" alignItems="center">
                <IconButton onClick={handleClick}>
                    {currentStatus === status ? (
                        <Icon color={color} style={{ fontSize: 40 }} />
                    ) : (
                        <IconOutlined color={color} sx={{ fontSize: 40 }} />
                    )}
                </IconButton>
                <Typography width="50px" style={{ textAlign: 'center' }}>
                    {text}
                </Typography>
            </Grid>
        </Grid>
    );
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, Icon, text, fontSize = 40 }) => {
    const color = getColor(status);
    return (
        <Grid item>
            <Grid container direction="column" alignItems="center">
                <Grid item>
                    <Icon color={color} style={{ fontSize }} />
                </Grid>
                <Grid item>
                    <Typography width="60px" style={{ textAlign: 'center' }}>
                        {text}
                    </Typography>
                </Grid>
            </Grid>
        </Grid>
    );
};

export const ReviewedAtProcessStatus: React.FC<{ isPrinting?: boolean; instance: IMongoProcessInstancePopulated | IMongoStepInstancePopulated }> = ({
    isPrinting,
    instance,
}) => {
    const currentUser = useUserStore((state) => state.user);

    return (
        <Grid item container justifyContent="center">
            <Grid item>
                <Typography fontSize={isPrinting ? '12px' : '14px'} style={{ textAlign: 'center' }}>
                    {`${i18next.t('wizard.processInstance.summary.statusChangedBy')} ${i18next.t('wizard.processInstance.summary.onDate')}:`}
                </Typography>
                <Typography fontSize={isPrinting ? '14px' : '16px'}>{getLongDate(instance.reviewedAt!)} </Typography>
            </Grid>
            {(instance as IMongoStepInstancePopulated).reviewer && (
                <Grid item container justifyContent="center" alignItems="center" style={{ margin: '0px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: isPrinting ? '14px' : undefined }}>
                        {` ${
                            currentUser.id === (instance as IMongoStepInstancePopulated).reviewer!._id
                                ? i18next.t('wizard.processInstance.summary.byYou')
                                : `${i18next.t('wizard.processInstance.summary.by')} ${(instance as IMongoStepInstancePopulated).reviewer!.fullName}`
                        }`}
                    </span>
                </Grid>
            )}
        </Grid>
    );
};

interface ProcessStatusProps {
    title?: string;
    instance: IMongoProcessInstancePopulated | IMongoStepInstancePopulated;
    editStatus?: {
        setFieldValue: FormikProps<ProcessStepValues>['setFieldValue'];
        isEditMode: boolean;
        values: FormikProps<ProcessStepValues>['values'];
    };
    isPrinting?: boolean;
}

const ProcessStatus: React.FC<ProcessStatusProps> = ({ title, instance, editStatus, isPrinting }) => {
    const handleSetStatus = (newStatus: Status) => {
        const newStatusToSet = newStatus !== editStatus!.values.status ? newStatus : Status.Pending;
        editStatus!.setFieldValue('status', newStatusToSet);
    };
    return (
        <Grid container flexDirection="column" alignItems="stretch" spacing={title ? 2 : 0}>
            {title && (
                <Grid item container flexDirection="row">
                    <Grid item container flexDirection="column" alignItems="center">
                        <Grid item>
                            <BlueTitle
                                title={title}
                                component="h4"
                                variant={editStatus ? 'h5' : 'h4'}
                                style={{ fontWeight: 600, opacity: 0.9, marginBottom: 7 }}
                            />
                        </Grid>

                        {isPrinting && (
                            <Grid item>
                                <BlueTitle
                                    title={'name' in instance ? instance.name : ''}
                                    component="h4"
                                    variant="h4"
                                    style={{ fontWeight: 600, opacity: 0.9, marginBottom: 7 }}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            )}

            <Grid item container alignItems="center" justifyContent="center" spacing={title ? 3 : 0}>
                {editStatus?.isEditMode ? (
                    <>
                        <StatusButton
                            status={Status.Approved}
                            currentStatus={editStatus.values.status}
                            handleClick={() => handleSetStatus(Status.Approved)}
                            Icon={CheckCircleIcon}
                            IconOutlined={CheckCircleOutlineIcon}
                            text={i18next.t('wizard.processInstance.summary.chooseProcessComplete')}
                        />
                        <StatusButton
                            status={Status.Rejected}
                            currentStatus={editStatus.values.status}
                            handleClick={() => handleSetStatus(Status.Rejected)}
                            Icon={CancelIcon}
                            IconOutlined={CancelOutlinedIcon}
                            text={i18next.t('wizard.processInstance.summary.choseProcessRejected')}
                        />
                    </>
                ) : (
                    <>
                        {instance.status === Status.Approved && (
                            <StatusDisplay
                                Icon={CheckCircleIcon}
                                text={i18next.t('wizard.processInstance.summary.processCompleted')}
                                status={instance.status}
                                fontSize={!editStatus ? 55 : undefined}
                            />
                        )}
                        {instance.status === Status.Rejected && (
                            <StatusDisplay
                                Icon={CancelIcon}
                                text={i18next.t('wizard.processInstance.summary.processRejected')}
                                status={instance.status}
                                fontSize={!editStatus ? 55 : undefined}
                            />
                        )}
                        {instance.status === Status.Pending && (
                            <StatusDisplay
                                Icon={AccessTimeFilledIcon}
                                text={i18next.t('wizard.processInstance.summary.processPending')}
                                status={instance.status}
                                fontSize={!editStatus ? 55 : undefined}
                            />
                        )}
                    </>
                )}
            </Grid>
            {instance.reviewedAt && !isPrinting && title && <ReviewedAtProcessStatus instance={instance} />}
        </Grid>
    );
};

export default ProcessStatus;
