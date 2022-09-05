import React, { useState } from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import { INotification } from '../../../interfaces/notifications';
import { getShortDate } from '../../../utils/date';
import { NotificationSeenRequest } from '../../../services/notificationService';

interface NotificationCardProps {
    notification: INotification;
    onSeen?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onSeen }) => {
    const [title, _setTitle] = useState('');
    const [element, _setElement] = useState<JSX.Element | null>(null);

    const { mutate, isLoading, isSuccess } = useMutation(() => NotificationSeenRequest(notification._id), {
        onSuccess: onSeen,
        onError: (error) => {
            // eslint-disable-next-line no-console
            console.log('failed to set notification as seen. error:', error);
            toast.error(i18next.t('notifications.failedSetAsSeen'));
        },
    });

    return (
        <Card
            sx={{
                marginTop: '0.5rem',
                marginX: '1rem',
                padding: '0.5rem',
                direction: 'rtl',
                pointerEvents: isSuccess ? 'none' : 'initial',
                opacity: isSuccess ? '0.20' : '1',
            }}
        >
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                <Grid container direction="column">
                    <Grid item container justifyContent="space-between" wrap="nowrap">
                        <Typography fontSize={14}>{getShortDate(notification.createdAt)}</Typography>

                        <Typography>{title}</Typography>
                    </Grid>

                    <Grid item>{element}</Grid>

                    <Grid item container justifyContent="space-between" wrap="nowrap">
                        <LoadingButton onClick={() => mutate()} loading={isLoading}>
                            {i18next.t('notifications.setAsSeen')}
                        </LoadingButton>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
