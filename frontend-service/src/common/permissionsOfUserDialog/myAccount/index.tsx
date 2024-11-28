import { Button, Divider, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IUser } from '../../../interfaces/users';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { getKartoffelUserProfileRequest, updateUserPreferencesMetadataRequest } from '../../../services/userService';
import { ErrorToast } from '../../ErrorToast';
import { UserProfile } from './userProfile';
import { UserDetails } from './userDetails';
import { SelectCheckbox } from '../../SelectCheckbox';
import { DayNightSwitch } from '../../inputs/DayNightSwitch';

const { notificationsMoreData } = environment.notifications;

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
        const updatedNotificationsTypes = notificationsToShowCheckbox.map(({ type }) => type);
        const hasPreferencesChanged =
            profilePreference.icon ||
            !isEqual(profilePreference.profilePath, existingUser.preferences.profilePath) ||
            !isEqual(updatedNotificationsTypes, existingUser.preferences.mailsNotificationsTypes);
        setIsPreferencesUpdated(hasPreferencesChanged);
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
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('user.failedToUpdateRequest')} />);
            },
        },
    );

    return (
        <>
            <Grid
                container
                item
                spacing={2}
                sx={{
                    padding: '0px 15px 9px 8px',
                    marginBottom: '0.8px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }}
            >
                <UserProfile
                    darkMode={darkMode}
                    editProfile={editProfile}
                    setEditProfile={setEditProfile}
                    existingUser={existingUser}
                    kartoffelUserProfile={kartoffelUserProfile}
                    profilePreference={profilePreference}
                    setProfilePreference={setProfilePreference}
                />

                <UserDetails existingUser={existingUser} editProfile={editProfile} />

                <Grid container item display="flex" justifyContent="space-between" alignItems="center" width="100%" margin={1}>
                    <Grid item>
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
                    <Grid item marginRight={1}>
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
