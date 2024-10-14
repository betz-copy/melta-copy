import { Avatar, Button, Checkbox, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';
import { getKartoffelUseByIdRequest, updateUserPreferencesMetadataRequest } from '../../services/userService';
import { UserProfilePicker } from '../inputs/userProfilePicker';
import { IKartoffelUser } from '../../interfaces/kartoffel';

const { notificationsMoreData } = environment.notifications;
const MyAccount: React.FC<{ existingUser: IUser; mode: 'create' | 'edit' | 'view' }> = ({ existingUser, mode }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    console.log({ existingUser, mode });

    const [selectedNotifications, setSelectedNotifications] = useState<NotificationType[]>(existingUser?.preferences.mailsNotificationsTypes || []);
    const [preferences, setPreferences] = useState<any>(existingUser?.preferences);
    const [kartoffelUser, setKartoffelUser] = useState<IKartoffelUser>();
    const userDetailsMap: { [key: string]: string | boolean | undefined } = {
        'Full Name': existingUser.fullName,
        Email: existingUser.mail,
        'Job Title': existingUser.jobTitle,
        Hierarchy: existingUser.hierarchy,
    };

    useEffect(() => {
        const getKartoffelUser = async () => {
            try {
                const user: IKartoffelUser = await getKartoffelUseByIdRequest(existingUser.externalMetadata.kartoffelId);
                setKartoffelUser(user);
            } catch (error) {
                console.error('Failed to fetch Kartoffel user:', error);
            }
        };

        getKartoffelUser();
    }, [existingUser]);
    console.log('gg', { kartoffelUser });

    const handleCheckboxChange = useCallback(
        async (type: NotificationType) => {
            const updatedSelections = selectedNotifications.includes(type)
                ? selectedNotifications.filter((notification) => notification !== type)
                : [...selectedNotifications, type];

            setSelectedNotifications(updatedSelections);
            setPreferences({ ...preferences, mailsNotificationsTypes: updatedSelections });
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
            <Grid container spacing={2} style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <Grid item xs={12}>
                    <Avatar src={existingUser.preferences.profilePath} sx={{ width: 80, height: 80 }} />
                    <Typography fontSize={13}>{existingUser.fullName} </Typography>
                </Grid>

                {Object.entries(userDetailsMap).map(([key, value]) => (
                    <React.Fragment key={key}>
                        <Grid item xs={6}>
                            <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                                {key}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} style={{ textAlign: 'right' }}>
                            <Typography variant="body1">{String(value)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                    </React.Fragment>
                ))}

                <Grid container>
                    <Typography variant="h6">התראות מייל </Typography>
                </Grid>
                <Grid container flexDirection="row" spacing={2}>
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
                            if (value.file) setPreferences({ ...preferences, icon: value, profilePath: undefined });
                            else setPreferences({ ...preferences, profilePath: value, icon: undefined });
                        }}
                        onDelete={() => {
                            setPreferences({ ...preferences, icon: undefined });
                        }}
                        kartoffelProfile={kartoffelUser?.pictures?.profile?.meta?.path}
                    />
                </Grid>
                {/* <img src="/icons/profileAvatar/avatar.jpg" /> */}
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

                {/* <UserProfile /> */}
            </Grid>
        </>
    );
};
export default MyAccount;
