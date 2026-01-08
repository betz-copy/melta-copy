import {
    Cancel as CancelIcon,
    CancelOutlined as CancelOutlinedIcon,
    CheckCircle as CheckCircleIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
} from '@mui/icons-material';
import { Grid, IconButton, SvgIconProps, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import {
    IMongoProcessInstancePopulated,
    Status,
    StatusBackgroundColors,
    StatusColorsNames,
    StatusFontColors,
} from '../../../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { useUserStore } from '../../../../stores/user';
import { getLongDate } from '../../../../utils/date';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { ProcessStepValues } from '../ProcessSteps/index';

interface StatusDisplayProps {
    status: Status;
    text: string;
    fontSize?: number;
    displayIcon?: boolean;
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

export const getFontColor = (status: Status) => {
    switch (status) {
        case Status.Approved:
            return StatusFontColors.Approved;
        case Status.Rejected:
            return StatusFontColors.Rejected;
        default:
            return StatusFontColors.Pending;
    }
};

const getBackgroundColor = (status: Status) => {
    switch (status) {
        case Status.Approved:
            return StatusBackgroundColors.Approved;
        case Status.Rejected:
            return StatusBackgroundColors.Rejected;
        default:
            return StatusBackgroundColors.Pending;
    }
};

interface StatusButtonProps extends StatusDisplayProps {
    currentStatus: Status;
    handleClick: () => void;
    Icon: React.ComponentType<SvgIconProps>;
    IconOutlined: React.ComponentType<SvgIconProps>;
}
const StatusButton: React.FC<StatusButtonProps> = ({ status, currentStatus, handleClick, Icon, IconOutlined, text }) => {
    const color = getColor(status);
    return (
        <Grid>
            <Grid container direction="column" alignItems="center">
                <IconButton onClick={handleClick}>
                    {currentStatus === status ? <Icon sx={{ color }} style={{ fontSize: 40 }} /> : <IconOutlined sx={{ fontSize: 40, color }} />}
                </IconButton>
                <Typography width="50px" style={{ textAlign: 'center' }}>
                    {text}
                </Typography>
            </Grid>
        </Grid>
    );
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, text, fontSize = 16, displayIcon = true }) => {
    const backgroundColor = getBackgroundColor(status);
    const fontColor = getFontColor(status);

    return (
        <Grid
            container
            alignItems="center"
            justifyContent="center"
            style={{ backgroundColor, borderRadius: '15px', height: '30px', width: displayIcon ? '110px' : '45px' }}
        >
            {displayIcon && (
                <Grid alignItems="center" height="100%">
                    <img style={{ height: '100%', width: fontSize }} src={`/icons/process-status-${status}.svg`} alt="process-status" />
                </Grid>
            )}
            <Typography width="60px" fontWeight="500" fontSize={displayIcon ? '16px' : '12px'} style={{ textAlign: 'center', color: fontColor }}>
                {text}
            </Typography>
        </Grid>
    );
};

export const ReviewedAtProcessStatus: React.FC<{ isPrinting?: boolean; instance: IMongoProcessInstancePopulated | IMongoStepInstancePopulated }> = ({
    isPrinting,
    instance,
}) => {
    const currentUser = useUserStore((state) => state.user);

    if (!instance.reviewedAt) return null;

    return (
        <Grid container justifyContent="center">
            <Grid>
                <Typography fontSize="12px" style={{ textAlign: 'center' }}>
                    {`${i18next.t('wizard.processInstance.summary.statusChangedBy')} ${i18next.t('wizard.processInstance.summary.onDate')}:`}
                </Typography>
                <Typography fontSize="12px">{getLongDate(instance.reviewedAt!)} </Typography>
            </Grid>
            {(instance as IMongoStepInstancePopulated).reviewer && (
                <Grid container justifyContent="center" alignItems="center" style={{ margin: '0px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: isPrinting ? '14px' : '12px' }}>
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
        <Grid container width="fit-content" height="fit-content" alignItems="center" spacing="15px">
            {title && (
                <Grid container flexDirection="row" width="fit-content" alignItems="center">
                    <Grid container flexDirection="column" alignItems="center">
                        <Grid>
                            <BlueTitle
                                title={`${title}: `}
                                component="h6"
                                variant={editStatus ? 'h6' : 'h6'}
                                style={{ fontWeight: 500, opacity: 0.9, fontSize: '14px' }}
                            />
                        </Grid>

                        {isPrinting && (
                            <Grid>
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

            <Grid container alignItems="center" justifyContent="center" width="fit-content">
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
                    <StatusDisplay
                        text={i18next.t(`wizard.processInstance.summary.processStatuses.${instance.status}`)}
                        status={instance.status}
                        fontSize={!editStatus ? 16 : undefined}
                    />
                )}
            </Grid>
        </Grid>
    );
};

export default ProcessStatus;
