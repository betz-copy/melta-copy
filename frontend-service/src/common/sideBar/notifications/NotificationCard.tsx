import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { INotificationPopulated, isRuleBreachAlertNotification, isRuleBreachRequestNotification, isRuleBreachResponseNotification } from '../../../interfaces/notifications';
import { getShortDate } from '../../../utils/date';
import { notificationSeenRequest } from '../../../services/notificationService';
import { RuleBreachAlertNotification } from './ruleBreachNotification/RuleBreachAlertNotification';
import { RuleBreachRequestNotification } from './ruleBreachNotification/RuleBreachRequestNotification';
import { RuleBreachResponseNotification } from './ruleBreachNotification/RuleBreachResponseNotification';
import { RootState } from '../../../store';

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

    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Card
            sx={{
                bgcolor: darkMode ? '#161616' : 'white',
                marginTop: '0.5rem',
                marginX: '1rem',
                padding: '0.5rem',
                pointerEvents: isSuccess ? 'none' : 'initial',
                opacity: isSuccess ? '0.20' : '1',
            }}
        >
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                <Grid container direction="column">
                    <Grid item container justifyContent="flex-end" wrap="nowrap">
                        <Typography fontSize={14}>{getShortDate(notification.createdAt)}</Typography>
                    </Grid>

                    <Grid item>
                        {isRuleBreachAlertNotification(notification) && <RuleBreachAlertNotification ruleBreachAlert={notification.metadata.alert} />}
                        {isRuleBreachRequestNotification(notification) && <RuleBreachRequestNotification ruleBreachRequest={notification.metadata.request} />}
                        {isRuleBreachResponseNotification(notification) && <RuleBreachResponseNotification ruleBreachRequest={notification.metadata.request} />}
                    </Grid>

                    <Grid item container justifyContent="flex-end" wrap="nowrap">
                        <LoadingButton onClick={() => mutate()} loading={isLoading}>
                            {i18next.t('notifications.setAsSeen')}
                        </LoadingButton>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
