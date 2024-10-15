import { Avatar, Button, Checkbox, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';
import { getKartoffelUseByIdRequest, updateUserPreferencesMetadataRequest } from '../../services/userService';
import { UserProfilePicker } from '../inputs/userProfilePicker';
import { IKartoffelUser } from '../../interfaces/kartoffel';
import { apiUrlToImageSource } from '../../services/storageService';
import { SelectCheckbox } from '../SelectCheckbox';
import UserAvatar, { getNameInitials } from '../UserAvatar';

const { notificationsMoreData } = environment.notifications;
const MyAccount: React.FC<{ existingUser: IUser; mode: 'create' | 'edit' | 'view' }> = ({ existingUser, mode }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(
        allNotifications.filter((notification) => existingUser?.preferences.mailsNotificationsTypes?.includes(notification.type)),
    );
    // const [selectedNotifications, setSelectedNotifications] = useState<NotificationType[]>(existingUser?.preferences.mailsNotificationsTypes || []);
    const [kartoffelUser, setKartoffelUser] = useState<IKartoffelUser>();
    // const [profile, setProfile] = useState<any>();
    const [editProfile, setEditProfile] = useState(false);
    const [preferences, setPreferences] = useState<any>(existingUser?.preferences);
    console.log({ notificationsToShowCheckbox });

    const userDetailsMap: { [key: string]: string | boolean | undefined } = {
        fullName: existingUser.fullName,
        email: existingUser.mail,
        jobTitle: existingUser.jobTitle,
        hierarchy: existingUser.hierarchy,
    };
    // console.log({ allNotifications });

    useEffect(() => {
        const getKartoffelUser = async () => {
            try {
                const user: IKartoffelUser = await getKartoffelUseByIdRequest(existingUser.externalMetadata.kartoffelId);
                setKartoffelUser(user);
            } catch (error) {
                console.error('Failed to fetch Kartoffel user:', error);
            }
        };

        // const getUserProfile = async () => {
        //     if (existingUser.preferences.profilePath) {
        //         if (
        //             existingUser.preferences.profilePath.startsWith('/icons/profileAvatar') ||
        //             existingUser.preferences.profilePath.startsWith('http://')
        //         ) {
        //             setProfile(existingUser.preferences.profilePath);
        //         } else {
        //             const icon = new Image();
        //             icon.src = await apiUrlToImageSource(
        //                 `/api${environment.api.storage}/${existingUser.preferences.profilePath}`,
        //                 'users-global-bucket',
        //             );
        //             setProfile(icon.src);
        //         }
        //     }
        // };

        getKartoffelUser();
        // getUserProfile();
    }, [existingUser]);

    const { isLoading, mutateAsync } = useMutation(
        (id: string) => updateUserPreferencesMetadataRequest(id, preferences, notificationsToShowCheckbox),
        {
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
        },
    );

    return (
        <>
            <Grid container spacing={2} style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <Grid container item display="flex" flexDirection="row" width="100%" xs={12} padding={2}>
                    <Grid item xs={6}>
                        <UserAvatar user={existingUser} size={65} />
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            onClick={() => {
                                setEditProfile(!editProfile);
                            }}
                            sx={{ justifyContent: 'center' }}
                        >
                            {editProfile ? 'סגור' : 'עריכת פרופיל'}
                        </Button>
                    </Grid>

                    {editProfile && (
                        <Grid item paddingTop={3}>
                            <UserProfilePicker
                                user={existingUser}
                                onPick={(value) => {
                                    if (!existingUser) return;
                                    if (!value) {
                                        setPreferences({ ...preferences, icon: undefined, profilePath: 'undefined' });
                                    } else if (value.file) setPreferences({ ...preferences, icon: value, profilePath: undefined });
                                    else {
                                        setPreferences({ ...preferences, profilePath: value, icon: undefined });
                                    }
                                }}
                                onDelete={() => {
                                    setPreferences({ ...preferences, icon: undefined });
                                }}
                                kartoffelProfile={kartoffelUser?.pictures?.profile?.meta?.path}
                            />
                        </Grid>
                    )}
                </Grid>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
                {Object.entries(userDetailsMap).map(([key, value]) => (
                    <>
                        <Grid item xs={6}>
                            <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                                {i18next.t(`user.${key}`)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body1">{String(value)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                    </>
                ))}

                <Grid item display="flex" justifyContent="center">
                    <SelectCheckbox
                        title={i18next.t('notifications.notificationType')}
                        options={allNotifications}
                        selectedOptions={notificationsToShowCheckbox}
                        setSelectedOptions={setNotificationsToShowCheckbox}
                        getOptionId={({ type }) => type}
                        getOptionLabel={(option) => option.displayName()}
                        size="small"
                        isDraggableDisabled
                        horizontalOrigin={156}
                    />
                </Grid>
            </Grid>
            <Grid>
                <Button
                    onClick={() => {
                        mutateAsync(existingUser!._id);
                    }}
                    variant="contained"
                >
                    סיים
                </Button>
            </Grid>
        </>
    );
};
export default MyAccount;
