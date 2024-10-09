import { Checkbox, FormControlLabel, Grid } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';
import { updateUserPreferencesMetadataRequest } from '../../services/userService';
import { InstanceSingleFileInput } from '../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { UserProfilePicker } from '../inputs/userProfilePicker';
import fileDetails from '../../interfaces/fileDetails';
import { useMutation } from 'react-query';
import { AxiosError } from 'axios';

const { notificationsMoreData } = environment.notifications;
const MyAccount: React.FC<{ existingUser?: IUser }> = ({ existingUser }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    console.log({ existingUser });

    const [selectedNotifications, setSelectedNotifications] = useState<NotificationType[]>(existingUser?.preferences.mailsNotificationsTypes || []);
    const [preferences, setPreferences] = useState({});

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

    const { isLoading, mutateAsync } = useMutation((id: string) => updateUserPreferencesMetadataRequest(id, preferences), {
        onSuccess: (data) => {
            // if (onSuccessUpdate) onSuccessUpdate(data);
            console.log('Efratoshhhh hameamemet');
        },
        onError: (err: AxiosError) => {
            console.log({ err });

            // const errorMetadata = handleMutationError(err, entityTemplate);
            // if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
            //     setCreateOrUpdateWithRuleBreachDialogState!({
            //         isOpen: true,
            //         brokenRules: errorMetadata.brokenRules,
            //         rawBrokenRules: errorMetadata.rawBrokenRules,
            //         newEntityData,
            //     });
            // }
            throw err;
        },
    });
    return (
        <Grid container>
            <Grid item>
                <UserProfilePicker
                    onPick={(value) => {
                        if (!existingUser) return;
                        setPreferences({ ...preferences, icon: value, mailsNotificationsTypes: selectedNotifications });
                        console.log('1');

                        mutateAsync(existingUser._id);
                        console.log('11');
                    }}
                    onDelete={() => {}}
                />
            </Grid>

            {/* <Grid container flexDirection="row" spacing={4}>
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
            </Grid> */}
        </Grid>
    );
};
export default MyAccount;
