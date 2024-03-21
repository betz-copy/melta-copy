import React, { useState } from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DoneIcon from '@mui/icons-material/Done';
import {
    INotificationPopulated,
    isNewProcessNotification,
    isProcessReviewerUpdateNotification,
    isProcessStatusUpdateNotification,
    isRuleBreachAlertNotification,
    isRuleBreachRequestNotification,
    isRuleBreachResponseNotification,
    isDateAboutToExpireNotification,
    isDeleteProcessNotification,
    isArchiveProcessNotification,
    NotificationType,
} from '../../../interfaces/notifications';
import { getShortDate } from '../../../utils/date';
import { notificationSeenRequest } from '../../../services/notificationService';
import { RuleBreachAlertNotification } from './ruleBreachNotification/RuleBreachAlertNotification';
import { RuleBreachRequestNotification } from './ruleBreachNotification/RuleBreachRequestNotification';
import { RuleBreachResponseNotification } from './ruleBreachNotification/RuleBreachResponseNotification';
import { RootState } from '../../../store';
import { NewProcessNotification } from './processNotifications/NewProcessNotification';
import { ProcessStatusUpdateNotification } from './processNotifications/ProcessStatusUpdateNotification';
import { ProcessReviewerUpdateNotification } from './processNotifications/ProcessReviewerUpdateNotification';
import { DeleteProcessNotification } from './processNotifications/DeleteProcessNotification';
import { DateAboutToExpireNotification } from './generalNotifications/DateAboutToExpireNotification';
import { ArchiveProcessNotification } from './processNotifications/ArchiveProcessNotification';

interface NotificationCardProps {
    notification: INotificationPopulated;
    onSeen?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onSeen }) => {
    const { mutate, isLoading, isSuccess } = useMutation(() => notificationSeenRequest(notification._id), {
        onSuccess: onSeen,
        onError: (error) => {
            // eslint-disable-next-line no-console
            console.log('failed to set notification as seen. error:', error);
            toast.error(i18next.t('notifications.failedSetAsSeen'));
        },
    });
    const [isHovered, setIsHovered] = useState(false);
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Card
            sx={{
                // eslint-disable-next-line no-nested-ternary
                bgcolor: notification.type === NotificationType.dateAboutToExpire ? 'rgba(255, 0, 107, 0.05)' : darkMode ? '#161616' : '#FFFFFF',
                marginTop: '0.5rem',
                marginX: '1rem',
                pointerEvents: isSuccess ? 'none' : 'initial',
                opacity: isSuccess ? '0.20' : '1',
                borderRadius: '20px',
                boxShadow: '-2px 2px 6px 0px #1E277540',
            }}
        >
            <CardContent sx={{ '&:last-child': { padding: '15px' } }}>
                <Grid container direction="column">
                    {!isDateAboutToExpireNotification(notification) && (
                        <Grid item container justifyContent="flex-end" wrap="nowrap">
                            <Typography sx={{ fontSize: '11px', fontWeight: '350px', color: '#5A6173' }}>
                                {getShortDate(notification.createdAt)}
                            </Typography>
                        </Grid>
                    )}
                    <Grid item sx={{ padding: '10px' }}>
                        {isRuleBreachAlertNotification(notification) && (
                            <RuleBreachAlertNotification {...notification.metadata} titleColor="#4752B6" />
                        )}
                        {isRuleBreachRequestNotification(notification) && (
                            <RuleBreachRequestNotification {...notification.metadata} titleColor="#4752B6" />
                        )}
                        {isRuleBreachResponseNotification(notification) && (
                            <RuleBreachResponseNotification {...notification.metadata} titleColor="#4752B6" />
                        )}
                        {isNewProcessNotification(notification) && <NewProcessNotification {...notification.metadata} titleColor="#4752B6" />}
                        {isProcessStatusUpdateNotification(notification) && (
                            <ProcessStatusUpdateNotification {...notification.metadata} titleColor="#4752B6" />
                        )}
                        {isProcessReviewerUpdateNotification(notification) && (
                            <ProcessReviewerUpdateNotification {...notification.metadata} titleColor="#4752B6" />
                        )}
                        {isDateAboutToExpireNotification(notification) && <DateAboutToExpireNotification {...notification.metadata} />}
                        {isDeleteProcessNotification(notification) && <DeleteProcessNotification {...notification.metadata} titleColor="#4752B6" />}
                        {isArchiveProcessNotification(notification) && <ArchiveProcessNotification {...notification.metadata} titleColor="#4752B6" />}
                    </Grid>
                    <Grid container wrap="nowrap" margin="-5px">
                        {isDateAboutToExpireNotification(notification) && (
                            <Grid item container alignItems="center" marginLeft="5.5%">
                                <Typography sx={{ fontSize: '11px', fontWeight: '350px', color: '#5A6173' }}>
                                    {getShortDate(notification.createdAt)}
                                </Typography>
                            </Grid>
                        )}
                        <Grid
                            item
                            container
                            justifyContent="flex-end"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <LoadingButton onClick={() => mutate()} loading={isLoading}>
                                <Grid item container alignItems="center" fontSize="12px" fontWeight={400} color="#5A6173">
                                    {isHovered && <DoneIcon fontSize="small" />}
                                    {i18next.t('notifications.setAsSeen')}
                                </Grid>
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
