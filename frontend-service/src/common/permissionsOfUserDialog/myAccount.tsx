import { Button, Divider, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IKartoffelUser } from '../../interfaces/kartoffel';
import { IUser } from '../../interfaces/users';
import { getKartoffelUseByIdRequest, updateUserPreferencesMetadataRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { SelectCheckbox } from '../SelectCheckbox';
import UserAvatar from '../UserAvatar';
import { DayNightSwitch } from '../inputs/DayNightSwitch';
import { UserProfilePicker } from '../inputs/userProfilePicker';

const { notificationsMoreData } = environment.notifications;

export const isProfileFileType = (profilePath?: string): boolean => {
    return !!profilePath && profilePath !== '' && !profilePath.startsWith('/icons/profileAvatar') && !profilePath.startsWith('http://');
};

export const defaultInputType = (profilePath?: string) => {
    if (!profilePath || profilePath.startsWith('/icons/profileAvatar')) return 'chooseAvatar';
    if (profilePath.startsWith('http://')) return 'kartoffelProfile';
    return 'chooseFile';
};

const MyAccount: React.FC<{ existingUser: IUser; handleClose: () => void }> = ({ existingUser, handleClose }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(
        allNotifications.filter((notification) => existingUser?.preferences.mailsNotificationsTypes?.includes(notification.type)),
    );
    const [kartoffelUser, setKartoffelUser] = useState<IKartoffelUser>();
    const [editProfile, setEditProfile] = useState(false);
    const [preferences, setPreferences] = useState<any>(existingUser?.preferences);
    const [isDataUpdated, setIsDataUpdated] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(preferences.darkMode ?? false);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const toggleDarkMode = useDarkModeStore((state) => state.toggleDarkMode);
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);

    const userDetailsMap: { [key: string]: string | boolean | undefined } = {
        fullName: existingUser.fullName,
        email: existingUser.mail,
        jobTitle: existingUser.jobTitle,
        hierarchy: existingUser.hierarchy,
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

    useEffect(() => {
        const arePreferencesChange = !isEqual(preferences, existingUser.preferences);
        const updatedNotificationsTypes = notificationsToShowCheckbox.map(({ type }) => type);
        const areNotificationsUpdated = !isEqual(updatedNotificationsTypes, existingUser.preferences.mailsNotificationsTypes);
        console.log({ arePreferencesChange, areNotificationsUpdated }, { updatedNotificationsTypes }, existingUser.preferences, preferences);

        setIsDataUpdated(arePreferencesChange || areNotificationsUpdated);
    }, [preferences, notificationsToShowCheckbox]);

    const { isLoading, mutateAsync } = useMutation(
        (id: string) => updateUserPreferencesMetadataRequest(id, preferences, notificationsToShowCheckbox),
        {
            onSuccess: (updatedUser: IUser) => {
                if (!existingUser) return;

                if (existingUser?._id === currentUser._id) {
                    console.log(currentUser, preferences);

                    setUser({
                        ...currentUser,
                        preferences: updatedUser.preferences,
                    });
                }

                toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToUpdatePermission'));
                handleClose();
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
            <Grid container spacing={2} style={{ padding: '15px', marginTop: '0.2px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <Grid container item display="flex" width="100%" xs={12} padding={2}>
                    <Grid item xs={6}>
                        <UserAvatar user={existingUser} size={100} />

                        <Button
                            onClick={() => {
                                setEditProfile(!editProfile);
                            }}
                            sx={{ color: darkMode ? 'white' : 'black', paddingTop: '12px' }}
                        >
                            {i18next.t(`user.${editProfile ? 'close' : 'edit'}`)}
                        </Button>

                        {editProfile && (
                            <Button
                                onClick={() => {
                                    const updatedPreferences = { ...preferences };
                                    delete updatedPreferences.icon;

                                    if (existingUser.preferences.profilePath) {
                                        updatedPreferences.profilePath = existingUser.preferences.profilePath;
                                    } else {
                                        delete updatedPreferences.profilePath;
                                    }

                                    setPreferences(updatedPreferences);
                                    setEditProfile(!editProfile);
                                }}
                                sx={{ justifyContent: 'center', color: darkMode ? 'white' : 'black', paddingTop: '13px' }}
                            >
                                {i18next.t('user.cancel')}
                            </Button>
                        )}
                    </Grid>

                    {editProfile && (
                        <Grid item paddingTop={3}>
                            <UserProfilePicker
                                user={existingUser}
                                onPick={(value: any) => {
                                    if (!existingUser) return;
                                    if (!value) {
                                        console.log('no value ');

                                        setPreferences({ ...preferences, icon: undefined, profilePath: undefined });
                                    } else if (value.file) {
                                        setPreferences({ ...preferences, icon: value, profilePath: undefined });
                                    } else {
                                        setPreferences({ ...preferences, icon: undefined, profilePath: value });
                                    }
                                }}
                                onDelete={() => {
                                    setPreferences({ ...preferences, icon: undefined, profilePath: undefined });
                                }}
                                kartoffelProfile={kartoffelUser?.pictures?.profile?.url}
                                imageName={isProfileFileType(existingUser.preferences.profilePath) ? existingUser.preferences.profilePath : undefined}
                                defaultInputType={defaultInputType(existingUser.preferences.profilePath)}
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

                <Grid container item display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Grid item marginLeft={1}>
                        <SelectCheckbox
                            title={i18next.t('notifications.notificationType')}
                            options={allNotifications}
                            selectedOptions={notificationsToShowCheckbox}
                            setSelectedOptions={setNotificationsToShowCheckbox}
                            getOptionId={({ type }) => type}
                            getOptionLabel={(option) => option.displayName()}
                            size="small"
                            toUserProfile
                            isDraggableDisabled
                            horizontalOrigin={148}
                        />
                    </Grid>
                    <Grid item marginRight={2}>
                        <DayNightSwitch
                            checked={darkMode}
                            onClick={() => {
                                setIsDarkMode(!isDarkMode);
                                setPreferences({ ...preferences, darkMode: !isDarkMode });
                                toggleDarkMode();
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid padding={2}>
                <Button
                    onClick={() => {
                        mutateAsync(existingUser!._id);
                        handleClose();
                    }}
                    disabled={!isDataUpdated}
                    variant="contained"
                    sx={{
                        position: 'absolute',
                        margin: '7px',
                        right: editProfile ? 10 : 20,
                        bottom: 3,
                    }}
                >
                    {i18next.t('user.done')}
                </Button>
            </Grid>
        </>
    );
};
export default MyAccount;
