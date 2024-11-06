import { Button, Divider, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IUser } from '../../interfaces/users';
import { getKartoffelUserProfileRequest, updateUserPreferencesMetadataRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { SelectCheckbox } from '../SelectCheckbox';
import UserAvatar from '../UserAvatar';
import { DayNightSwitch } from '../inputs/DayNightSwitch';
import { UserProfilePicker } from '../inputs/userProfilePicker';
import { ErrorToast } from '../ErrorToast';

const { notificationsMoreData } = environment.notifications;

export const isProfileFileType = (profilePath?: string): boolean => {
    return !!profilePath && profilePath !== '' && !profilePath.startsWith('/icons/profileAvatar') && !profilePath.startsWith('http://');
};

const defaultInputType = (profilePath?: string) => {
    if (!profilePath || profilePath.startsWith('/icons/profileAvatar')) return 'chooseAvatar';
    if (profilePath.startsWith('http://')) return 'kartoffelProfile';
    return 'chooseFile';
};

const MyAccount: React.FC<{
    existingUser: IUser;
    handleClose: () => void;
    isPreferencesUpdated: boolean;
    setIsPreferencesUpdated: (isUpdate: boolean) => void;
}> = ({ existingUser, handleClose, isPreferencesUpdated, setIsPreferencesUpdated }) => {
    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(
        allNotifications.filter((notification) => existingUser?.preferences.mailsNotificationsTypes?.includes(notification.type)),
    );
    const [kartoffelUserProfile, setKartoffelUserProfile] = useState<string>();
    const [editProfile, setEditProfile] = useState(false);
    const [profilePreference, setProfilePreference] = useState<{ profilePath?: string; icon?: any }>({
        profilePath: existingUser?.preferences.profilePath,
    });
    const [isDarkMode, setIsDarkMode] = useState(existingUser.preferences.darkMode ?? false);
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
        const fetchUserProfile = async () => {
            try {
                const kartoffelProfile = await getKartoffelUserProfileRequest(existingUser.externalMetadata.kartoffelId);
                setKartoffelUserProfile(kartoffelProfile);
            } catch (error) {
                console.error('Failed to fetch Kartoffel user profile:', error);
            }
        };

        fetchUserProfile();
    }, [existingUser]);

    useEffect(() => {
        const arePreferencesChange = profilePreference.icon || !isEqual(profilePreference.profilePath, existingUser.preferences.profilePath);
        const updatedNotificationsTypes = notificationsToShowCheckbox.map(({ type }) => type);
        const areNotificationsUpdated = !isEqual(updatedNotificationsTypes, existingUser.preferences.mailsNotificationsTypes);
        setIsPreferencesUpdated(arePreferencesChange || areNotificationsUpdated || !isEqual(isDarkMode, existingUser.preferences.darkMode));
    }, [profilePreference, notificationsToShowCheckbox]);

    const { mutateAsync } = useMutation(
        (id: string) =>
            updateUserPreferencesMetadataRequest(
                id,
                profilePreference,
                notificationsToShowCheckbox.map(({ type }) => type),
                isDarkMode,
            ),
        {
            onSuccess: (updatedUser: IUser) => {
                if (!existingUser) return;

                if (existingUser?._id === currentUser._id) {
                    setUser({
                        ...currentUser,
                        preferences: updatedUser.preferences,
                    });
                }

                toast.success(i18next.t('user.succeededToUpdatePreferences'));
                handleClose();
            },

            onError: (err: AxiosError) => {
                console.log('failed to create rule breach request. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('user.failedToCreateRequest')} />);
            },
        },
    );

    return (
        <>
            <Grid
                container
                spacing={2}
                sx={{
                    padding: '0px 15px 9px 8px',
                    marginBottom: '0.8px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }}
            >
                <Grid container item display="flex" width="100%" xs={12} padding={editProfile ? 1 : 0}>
                    <Grid item xs={6}>
                        <UserAvatar user={existingUser} size={100} />
                        <Button
                            onClick={() => {
                                setEditProfile(!editProfile);
                            }}
                            sx={{ color: darkMode ? 'white' : 'black', paddingTop: '12px', left: editProfile ? 0 : 5 }}
                        >
                            {i18next.t(`user.${editProfile ? 'close' : 'edit'}`)}
                        </Button>

                        {editProfile && (
                            <Button
                                onClick={() => {
                                    const updatedPreferences = { ...profilePreference };
                                    delete updatedPreferences.icon;

                                    if (existingUser.preferences.profilePath) {
                                        updatedPreferences.profilePath = existingUser.preferences.profilePath;
                                    } else {
                                        delete updatedPreferences.profilePath;
                                    }

                                    setProfilePreference(updatedPreferences);
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
                                        setProfilePreference({ icon: undefined, profilePath: undefined });
                                    } else if (value.file) {
                                        setProfilePreference({ icon: value, profilePath: undefined });
                                    } else {
                                        setProfilePreference({ icon: undefined, profilePath: value });
                                    }
                                }}
                                onDelete={() => {
                                    setProfilePreference({ icon: undefined, profilePath: undefined });
                                }}
                                kartoffelProfile={kartoffelUserProfile}
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
                            horizontalOrigin={153}
                        />
                    </Grid>
                    <Grid item marginRight={2}>
                        <DayNightSwitch
                            checked={darkMode}
                            onClick={() => {
                                setIsDarkMode(!isDarkMode);
                                toggleDarkMode();
                                updateUserPreferencesMetadataRequest(
                                    existingUser!._id,
                                    existingUser.preferences,
                                    existingUser.preferences.mailsNotificationsTypes,
                                    !isDarkMode,
                                );
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid padding={3}>
                <Button
                    onClick={() => {
                        mutateAsync(existingUser!._id);
                        handleClose();
                    }}
                    disabled={!isPreferencesUpdated}
                    variant="contained"
                    sx={{
                        position: 'absolute',
                        marginY: '0.5px',
                        right: editProfile ? 16 : 20,
                        bottom: editProfile ? 10 : 18,
                    }}
                >
                    {i18next.t('user.save')}
                </Button>
            </Grid>
        </>
    );
};
export default MyAccount;
