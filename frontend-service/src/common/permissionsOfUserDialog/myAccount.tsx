import { Checkbox, FormControlLabel, Grid } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';
import { updateUserPreferencesMetadataRequest } from '../../services/userService';
import { InstanceSingleFileInput } from '../inputs/InstanceFilesInput/InstanceSingleFileInput';

const { notificationsMoreData } = environment.notifications;
const MyAccount: React.FC<{ existingUser?: IUser }> = ({ existingUser }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    console.log({ existingUser });

    const [selectedNotifications, setSelectedNotifications] = useState<NotificationType[]>(existingUser?.preferences.mailsNotificationsTypes || []);

    const handleCheckboxChange = useCallback(
        async (type: NotificationType) => {
            const updatedSelections = selectedNotifications.includes(type)
                ? selectedNotifications.filter((notification) => notification !== type)
                : [...selectedNotifications, type];

            setSelectedNotifications(updatedSelections);

            if (existingUser)
                await updateUserPreferencesMetadataRequest(existingUser._id, {
                    ...existingUser.preferences,
                    mailsNotificationsTypes: updatedSelections,
                });
        },
        [selectedNotifications],
    );
    console.log({ selectedNotifications });

    return (
        <Grid container>
            <Grid sx={{ backgroundColor: 'grey' }} width="100%" height="100px" />
            <Grid item>
                <InstanceSingleFileInput
                    // key={key}
                    fileFieldName="hhhh"
                    fieldTemplateTitle="ggg"
                    // setFieldValue={setFieldValue}
                    // required={requiredFilesNames.includes(key)}
                    value={existingUser?.preferences.profileImgId as File | undefined}
                    error="erorrrrr"
                    // setFieldTouched={null}
                    setExternalErrors={() => {}}
                    // eslint-disable-next-line react/jsx-no-bind
                    setFieldValue={function (_field: string): void {
                        throw new Error('Function not implemented.');
                    }}
                    required={false}
                />
            </Grid>
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
        </Grid>
    );
};
export default MyAccount;
