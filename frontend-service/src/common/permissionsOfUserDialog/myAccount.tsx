import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';
import { updateUserPreferencesMetadataRequest } from '../../services/userService';
import { InstanceSingleFileInput } from '../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { UserProfilePicker } from '../inputs/userProfilePicker';
import fileDetails from '../../interfaces/fileDetails';

const { notificationsMoreData } = environment.notifications;
const MyAccount: React.FC<{ existingUser?: IUser; mode: 'create' | 'edit' | 'view' }> = ({ existingUser, mode }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    console.log({ existingUser, mode });

    const [selectedNotifications, setSelectedNotifications] = useState<NotificationType[]>(existingUser?.preferences.mailsNotificationsTypes || []);
    const [preferences, setPreferences] = useState<any>(existingUser?.preferences);

    const handleCheckboxChange = useCallback(
        async (type: NotificationType) => {
            const updatedSelections = selectedNotifications.includes(type)
                ? selectedNotifications.filter((notification) => notification !== type)
                : [...selectedNotifications, type];

            setSelectedNotifications(updatedSelections);
            setPreferences({ ...preferences, mailsNotificationsTypes: updatedSelections });
            // if (existingUser)
            //     await updateUserPreferencesMetadataRequest(existingUser._id, {
            //         ...existingUser.preferences,
            //         mailsNotificationsTypes: updatedSelections,
            //     });
        },
        [selectedNotifications],
    );
    console.log({ selectedNotifications });

    const { isLoading, mutateAsync } = useMutation((id: string) => updateUserPreferencesMetadataRequest(id, preferences), {
        onSuccess: (data) => {
            // if (onSuccessUpdate) onSuccessUpdate(data);
        },
        onError: (err: AxiosError) => {
            console.log({ err });

            // const errorMetadata = handleMutationError(err, entityTemplate);
            // if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
            //     setCreateOrUpdateWithRuleBreachDia   logState!({
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
        <>
            <Grid container>
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
                <Grid item>
                    <UserProfilePicker
                        onPick={(value) => {
                            if (!existingUser) return;
                            setPreferences({ ...preferences, icon: value });
                            console.log('1');

                            // mutateAsync(existingUser._id);
                            console.log('11');
                        }}
                        onDelete={() => {
                            setPreferences({ ...preferences, icon: undefined });
                        }}
                    />
                </Grid>
                <Grid>
                    <Button onClick={() => setPreferences({ ...preferences, profilePath: existingUser?.profile, icon: undefined })}>
                        kartoffel proofile
                    </Button>
                </Grid>
            </Grid>

            <Grid>
                <Button
                    // type="button"
                    //     formikProps.isSubmitting ||
                    //     didPermissionsChange(formikProps.initialValues.permissions, formikProps.values.permissions) ||
                    //     userHasNoPermissions(formikProps.values.permissions[workspace._id])
                    // }
                    onClick={() => mutateAsync(existingUser!._id)}
                    variant="contained"
                >
                    סיים
                    {/* {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                    {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.saveBtn')}
                    {formikProps.isSubmitting && <CircularProgress size={20} />} */}
                </Button>
            </Grid>
        </>
    );
};
export default MyAccount;
