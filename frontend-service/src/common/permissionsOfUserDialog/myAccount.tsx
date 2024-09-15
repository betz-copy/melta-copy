import { Checkbox, FormControlLabel, Grid } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';

const { notificationsMoreData } = environment.notifications;
const MyAccount: React.FC<{ existingUser?: IUser }> = ({ existingUser }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];

    const [selectedNotifications, setSelectedNotifications] = useState<NotificationType[]>(existingUser?.preferences.mailsNotificationsTypes || []);

    const handleCheckboxChange = useCallback(
        async (type: NotificationType) => {
            const updatedSelections = selectedNotifications.includes(type)
                ? selectedNotifications.filter((notification) => notification !== type)
                : [...selectedNotifications, type];

            setSelectedNotifications(updatedSelections);

            // await updateUser({ mailsNotificationsTypes: updatedSelections });
        },
        [selectedNotifications],
    );
    console.log({ selectedNotifications });

    return (
        <Grid container flexDirection="row" spacing={4}>
            {allNotifications.map((notification) => (
                <Grid item key={notification.type}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedNotifications.includes(notification.type)}
                                onChange={() => handleCheckboxChange(notification.type)}
                            />
                        }
                        label={notification.displayName()}
                    />
                </Grid>
            ))}
        </Grid>
    );
};
export default MyAccount;
