import { Button, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IUser, IUserPopulated } from '../../../interfaces/users';
import { getUserRolePerWorkspaceRequest, updateUserPreferencesMetadataRequest } from '../../../services/userService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { ErrorToast } from '../../ErrorToast';
import { DayNightSwitch } from '../../inputs/DayNightSwitch';
import { SelectCheckbox } from '../../SelectCheckBox';
import { UserDetails } from './userDetails';
import { UserProfile } from './userProfile';

const { notificationsMoreData } = environment.notifications;

const MyAccount: React.FC<{
    existingUser: IUser;
    handleClose: () => void;
    isPreferencesUpdated: boolean;
    setIsPreferencesUpdated: (isUpdate: boolean) => void;
}> = ({ existingUser, handleClose, isPreferencesUpdated, setIsPreferencesUpdated }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const allNotifications = [...notificationsMoreData.requests, ...notificationsMoreData.general];
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(
        allNotifications.filter((notification) => existingUser?.preferences.mailsNotificationsTypes?.includes(notification.type)),
    );
    const [editProfile, setEditProfile] = useState(false);
    const [profilePreference, setProfilePreference] = useState<{ profilePath?: string; icon?: any }>({
        profilePath: existingUser?.preferences.profilePath,
    });
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const toggleDarkMode = useDarkModeStore((state) => state.toggleDarkMode);
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);

    useEffect(() => {
        const updatedNotificationsTypes = notificationsToShowCheckbox.map(({ type }) => type);
        const hasPreferencesChanged =
            profilePreference.icon ||
            !isEqual(profilePreference.profilePath, existingUser.preferences.profilePath) ||
            !isEqual(updatedNotificationsTypes, existingUser.preferences.mailsNotificationsTypes);
        setIsPreferencesUpdated(hasPreferencesChanged);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profilePreference, notificationsToShowCheckbox]);

    const { mutateAsync } = useMutation(
        (id: string) =>
            updateUserPreferencesMetadataRequest(
                id,
                profilePreference,
                notificationsToShowCheckbox.map(({ type }) => type),
                darkMode,
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
                console.error('failed to update user`s preferences request. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('user.failedToUpdateRequest')} />);
            },
        },
    );

    const { data: role } = useQuery(
        ['getUserRolePerWorkspace', existingUser.roleIds],
        () => (existingUser.roleIds ? getUserRolePerWorkspaceRequest(workspace._id, existingUser.roleIds) : null),
        {
            enabled: !!existingUser.roleIds,
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
        },
    );

    const userPopulated: IUserPopulated = role
        ? {
              ...existingUser,
              roles: [role],
              ...(existingUser.roleIds && { roleIds: undefined }),
          }
        : existingUser;

    return (
        <Grid container>
            <Grid
                container
                sx={{
                    padding: '0px 17px 6px 10px',
                    margin: '20px',
                    marginBottom: '25px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }}
            >
                <UserProfile
                    darkMode={darkMode}
                    editProfile={editProfile}
                    setEditProfile={setEditProfile}
                    existingUser={existingUser}
                    profilePreference={profilePreference}
                    setProfilePreference={setProfilePreference}
                />

                <UserDetails existingUser={userPopulated} editProfile={editProfile} />

                <Grid container display="flex" justifyContent="space-between" alignItems="center" width="100%" margin={1}>
                    <Grid>
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
                    <Grid marginRight={1}>
                        <DayNightSwitch
                            checked={darkMode}
                            onClick={() => {
                                toggleDarkMode();
                                updateUserPreferencesMetadataRequest(
                                    existingUser!._id,
                                    existingUser.preferences,
                                    existingUser.preferences.mailsNotificationsTypes ?? [],
                                    !darkMode,
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
        </Grid>
    );
};
export default MyAccount;
