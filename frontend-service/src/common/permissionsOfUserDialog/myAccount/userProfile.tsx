import { Button, Grid } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import UserAvatar from '../../UserAvatar';
import { UserProfilePicker } from '../../inputs/userProfilePicker';
import { defaultInputType, isProfileFileType } from '../../../utils/profileType';
import { IUser } from '../../../interfaces/users';

const UserProfile: React.FC<{
    existingUser: IUser;
    darkMode: boolean;
    kartoffelUserProfile?: string;
    editProfile: boolean;
    setEditProfile: (editProfile: boolean) => void;
    profilePreference: { profilePath?: string; icon?: any };
    setProfilePreference: (profilePreference: { profilePath?: string; icon?: any }) => void;
}> = ({ existingUser, editProfile, darkMode, profilePreference, setProfilePreference, setEditProfile, kartoffelUserProfile }) => {
    return (
        <>
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
        </>
    );
};

export { UserProfile };
