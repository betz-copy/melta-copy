import { Avatar, Button, Checkbox, Divider, FormControlLabel, Grid, Switch, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import isEqual from 'lodash/isEqual';
import { IUser } from '../../interfaces/users';
import { NotificationType } from '../../interfaces/notifications';
import { environment } from '../../globals';
import { getKartoffelUseByIdRequest, updateUserPreferencesMetadataRequest } from '../../services/userService';
import { UserProfilePicker } from '../inputs/userProfilePicker';
import { IKartoffelUser } from '../../interfaces/kartoffel';
import { apiUrlToImageSource } from '../../services/storageService';
import { SelectCheckbox } from '../SelectCheckbox';
import UserAvatar, { getNameInitials } from '../UserAvatar';
import { getFileName } from '../../utils/getFileName';
import { DayNightSwitch } from '../inputs/DayNightSwitch';
import { useDarkModeStore } from '../../stores/darkMode';

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
    const [imageName, setImageName] = useState('');
    const [isDataUpdated, setIsDataUpdated] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(preferences.darkMode ?? false);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const toggleDarkMode = useDarkModeStore((state) => state.toggleDarkMode);
    console.log({ darkMode });

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
        const fileName = existingUser.preferences.profilePath ? getFileName(existingUser.preferences.profilePath) : '';
        console.log({ fileName }, existingUser.preferences.profilePath);

        setImageName(isProfileFileType(preferences.profilePath) ? fileName : '');
        console.log({ imageName });
    }, []);

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
            <Grid container spacing={2} style={{ padding: '15px', marginTop: '0.2px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <Grid container item display="flex" flexDirection="row" width="100%" xs={12} padding={2}>
                    <Grid item xs={6}>
                        <UserAvatar user={existingUser} size={65} />
                    </Grid>

                    <Grid item xs={6}>
                        <Button
                            onClick={() => {
                                setEditProfile(!editProfile);
                            }}
                            sx={{ justifyContent: 'end' }}
                        >
                            {editProfile ? 'סגור' : 'עריכת פרופיל'}
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
                                sx={{ justifyContent: 'center' }}
                            >
                                ביטול שינויים
                            </Button>
                        )}
                    </Grid>

                    {editProfile && (
                        <Grid item paddingTop={3}>
                            <UserProfilePicker
                                user={existingUser}
                                onPick={(value: any) => {
                                    console.log('3', { value });

                                    if (!existingUser) return;
                                    if (!value) {
                                        setPreferences({ ...preferences, icon: undefined, profilePath: undefined });
                                    } else if (value.file) {
                                        setPreferences({ ...preferences, icon: value, profilePath: undefined });
                                        setImageName(value.name);
                                    } else {
                                        setPreferences({ ...preferences, icon: undefined, profilePath: value });
                                    }
                                    console.log('4');
                                }}
                                onDelete={() => {
                                    console.log('lllllllllllllllllllllllllllllllllllllllllllll');
                                    setImageName('');
                                    setPreferences({ ...preferences, icon: undefined, profilePath: undefined });
                                }}
                                kartoffelProfile={kartoffelUser?.pictures?.profile?.url}
                                image={imageName}
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

                <Grid item display="flex" justifyContent="space-around" alignItems="center" width="100%" margin={0}>
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
                    סיים
                </Button>
            </Grid>
        </>
    );
};
export default MyAccount;
