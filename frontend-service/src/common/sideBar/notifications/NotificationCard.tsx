import { Done as DoneIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { INotificationPopulated, NotificationType } from '@packages/notification';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import {
    isArchiveProcessNotification,
    isDateAboutToExpireNotification,
    isDeleteProcessNotification,
    isNewProcessNotification,
    isProcessReviewerUpdateNotification,
    isProcessStatusUpdateNotification,
    isRuleBreachAlertNotification,
    isRuleBreachRequestNotification,
    isRuleBreachResponseNotification,
} from '../../../interfaces/notifications';
import { notificationSeenRequest } from '../../../services/notificationService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getShortDate } from '../../../utils/date';
import { DateAboutToExpireNotification } from './generalNotifications/DateAboutToExpireNotification';
import { ArchiveProcessNotification } from './processNotifications/ArchiveProcessNotification';
import { DeleteProcessNotification } from './processNotifications/DeleteProcessNotification';
import { NewProcessNotification } from './processNotifications/NewProcessNotification';
import { ProcessReviewerUpdateNotification } from './processNotifications/ProcessReviewerUpdateNotification';
import { ProcessStatusUpdateNotification } from './processNotifications/ProcessStatusUpdateNotification';
import { RuleBreachAlertNotification } from './ruleBreachNotification/RuleBreachAlertNotification';
import { RuleBreachRequestNotification } from './ruleBreachNotification/RuleBreachRequestNotification';
import { RuleBreachResponseNotification } from './ruleBreachNotification/RuleBreachResponseNotification';

interface NotificationCardProps {
    notification: INotificationPopulated;
    onSeen?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onSeen }) => {
    const { mutate, isLoading, isSuccess } = useMutation(() => notificationSeenRequest(notification._id), {
        onSuccess: onSeen,
        onError: (error) => {
            console.error('failed to set notification as seen. error:', error);
            toast.error(i18next.t('notifications.failedSetAsSeen'));
        },
    });
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            sx={{
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
                    <Grid container justifyContent="flex-end" wrap="nowrap">
                        <Typography sx={{ fontSize: '11px', fontWeight: '350px' }}>{getShortDate(notification.createdAt)}</Typography>
                    </Grid>

                    <Grid sx={{ padding: '10px' }}>
                        {isRuleBreachAlertNotification(notification) && <RuleBreachAlertNotification notificationMetadata={notification.metadata} />}
                        {isRuleBreachRequestNotification(notification) && (
                            <RuleBreachRequestNotification notificationMetadata={notification.metadata} />
                        )}
                        {isRuleBreachResponseNotification(notification) && (
                            <RuleBreachResponseNotification notificationMetadata={notification.metadata} />
                        )}
                        {isNewProcessNotification(notification) && <NewProcessNotification notificationMetadata={notification.metadata} />}
                        {isProcessStatusUpdateNotification(notification) && (
                            <ProcessStatusUpdateNotification notificationMetadata={notification.metadata} />
                        )}
                        {isProcessReviewerUpdateNotification(notification) && (
                            <ProcessReviewerUpdateNotification notificationMetadata={notification.metadata} />
                        )}
                        {isDateAboutToExpireNotification(notification) && (
                            <DateAboutToExpireNotification notificationMetadata={notification.metadata} />
                        )}
                        {isDeleteProcessNotification(notification) && <DeleteProcessNotification notificationMetadata={notification.metadata} />}
                        {isArchiveProcessNotification(notification) && <ArchiveProcessNotification notificationMetadata={notification.metadata} />}
                    </Grid>
                    <Grid container wrap="nowrap" margin="-5px">
                        <Grid container justifyContent="flex-end" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <LoadingButton onClick={() => mutate()} loading={isLoading}>
                                <Grid container alignItems="center" fontSize="12px" fontWeight={400}>
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
