import React from 'react';
import i18next from 'i18next';
import { Grid, IconButton, SvgIconProps, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { FormikProps } from 'formik';
import { useSelector } from 'react-redux';
import { useQueryClient } from 'react-query';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { getLongDate } from '../../../../utils/date';
import { BlueTitle } from '../../../BlueTitle';
import { RootState } from '../../../../store';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { ProcessStepValues } from '../ProcessSteps/index';
import { IUser } from '../../../../services/kartoffelService';
import { StatusColorsNames } from '../../../../pages/ProcessInstances/ProcessCard';
import { IPermissionsOfUser } from '../../../../services/permissionsService';

interface StatusDisplayProps {
    status: Status;
    Icon: React.ComponentType<SvgIconProps>;
    text: string;
    fontSize?: number;
}

const getColor = (status: Status) => {
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

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, Icon, text, fontSize = 40 }) => {
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

interface ProcessStatusProps {
    title: string;
    instance: IMongoProcessInstancePopulated | IMongoStepInstancePopulated;
    editStatus?: {
        setFieldValue: FormikProps<ProcessStepValues>['setFieldValue'];
        isEditMode: boolean;
        values: FormikProps<ProcessStepValues>['values'];
    };
    isPrinting?: boolean;
}

const ProcessStatus: React.FC<ProcessStatusProps> = ({ title, instance, editStatus, isPrinting }) => {
    const currentUser = useSelector((state: RootState) => state.user) as IUser;
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const handleSetStatus = (newStatus: Status) => {
        const newStatusToSet = newStatus !== editStatus!.values.status ? newStatus : Status.Pending;
        editStatus!.setFieldValue('status', newStatusToSet);
    };
    return (
        <Grid container flexDirection="column" alignItems="stretch" spacing={2}>
            <Grid item container flexDirection="row">
                <Grid item container flexDirection="column" alignItems="flex-end" style={{ display: isPrinting ? 'inherit' : 'none' }}>
                    <Typography>{`${i18next.t('wizard.processInstance.summary.printedAt')} : ${new Date().toLocaleDateString('en-UK')}`}</Typography>
                    <Typography>{`${i18next.t('wizard.processInstance.summary.printedBy')} : ${myPermissions.user.fullName}`}</Typography>
                </Grid>

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
                <Grid item container justifyContent="center">
                    <Grid item>
                        <span>{i18next.t('wizard.processInstance.summary.statusChangedBy')}</span>
                        <span style={{ margin: '0px' }}>{` ${i18next.t('wizard.processInstance.summary.onDate')}: ${getLongDate(
                            instance.reviewedAt,
                        )} `}</span>
                    </Grid>
                    {(instance as IMongoStepInstancePopulated).reviewer && (
                        <Grid item container justifyContent="center" alignItems="center" style={{ margin: '0px' }}>
                            <span style={{ fontWeight: 'bold' }}>
                                {` ${
                                    currentUser.id === (instance as IMongoStepInstancePopulated).reviewer!.id
                                        ? i18next.t('wizard.processInstance.summary.byYou')
                                        : `${i18next.t('wizard.processInstance.summary.by')} ${
                                              (instance as IMongoStepInstancePopulated).reviewer!.fullName
                                          }`
                                }`}
                            </span>
                        </Grid>
                    )}
                </Grid>
            )}
        </Grid>
    );
};

export default ProcessStatus;
