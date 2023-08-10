import React from 'react';
import i18next from 'i18next';
import { BlueTitle } from '../../../BlueTitle';
import { Grid, IconButton, SvgIconProps, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { getLongDate } from '../../../../utils/date';
import { FormikProps } from 'formik';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { ProcessStepValues } from '../ProcessSteps/index';
import { IUser } from '../../../../services/kartoffelService';
interface StatusDisplayProps {
    status: Status;
    Icon: React.ComponentType<SvgIconProps>;
    text: string;
    fontSize?: number;
}

interface StatusButtonProps extends StatusDisplayProps {
    currentStatus: Status;
    handleClick: () => void;
    IconOutlined: React.ComponentType<SvgIconProps>;
}
const StatusButton: React.FC<StatusButtonProps> = ({ status, currentStatus, handleClick, Icon, IconOutlined, text }) => {
    const color = status === Status.Approved ? 'success' : status === Status.Rejected ? 'error' : 'primary';
    return (
        <Grid item>
            <Grid container direction="column" alignItems="center">
                <IconButton onClick={handleClick}>
                    {currentStatus === status ? <Icon color={color} sx={{ fontSize: 40 }} /> : <IconOutlined color={color} sx={{ fontSize: 40 }} />}
                </IconButton>
                <Typography width="50px" style={{ textAlign: 'center' }}>
                    {text}
                </Typography>
            </Grid>
        </Grid>
    );
};

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, Icon, text, fontSize = 40 }) => {
    const color = status === Status.Approved ? 'success' : status === Status.Rejected ? 'error' : 'primary';
    return (
        <Grid item>
            <Grid container direction="column" alignItems="center">
                <Grid item>
                    <Icon color={color} sx={{ fontSize: fontSize }} />
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

interface ProcessStatusProps {
    title: string;
    instance: IMongoProcessInstancePopulated | IMongoStepInstancePopulated;
    editStatus?: {
        setFieldValue: FormikProps<ProcessStepValues>['setFieldValue'];
        isEditMode: boolean;
        values: FormikProps<ProcessStepValues>['values'];
    };
}

const ProcessStatus: React.FC<ProcessStatusProps> = ({ title, instance, editStatus }) => {
    const currentUser = useSelector((state: RootState) => state.user) as IUser;
    const handleSetStatus = (newStatus: Status) => {
        const newStatusToSet = newStatus !== editStatus!.values.status ? newStatus : Status.Pending;
        editStatus!.setFieldValue('status', newStatusToSet);
    };
    return (
        <Grid container flexDirection="column" alignItems="stretch" spacing={2}>
            <Grid item container justifyContent="center">
                <BlueTitle
                    title={title}
                    component={'h4'}
                    variant={editStatus ? 'h5' : 'h4'}
                    style={{ fontWeight: 600, opacity: 0.9, marginBottom: 7 }}
                />
            </Grid>
            <Grid item container alignItems="center" justifyContent="center" spacing={3}>
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
            {instance.reviewedAt && (
                <Grid item container justifyContent={'center'}>
                    <Grid item>
                        <span>{i18next.t('wizard.processInstance.summary.statusChangedBy')}</span>
                        <span style={{ margin: '0px' }}>{` ${i18next.t('wizard.processInstance.summary.onDate')}: ${getLongDate(
                            instance.reviewedAt,
                        )} `}</span>
                        {instance.reviewer && (
                            <p style={{ margin: '0px' }}>
                                <span style={{ fontWeight: 'bold' }}>{` ${
                                    currentUser.id === instance.reviewer?.id
                                        ? i18next.t('wizard.processInstance.summary.byYou')
                                        : `${i18next.t('wizard.processInstance.summary.by')} ${instance.reviewer?.fullName}`
                                }`}</span>
                            </p>
                        )}
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
};

export default ProcessStatus;
