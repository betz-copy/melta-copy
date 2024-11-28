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
        <Grid container display="flex" justifyContent="center" padding={2}>
            <Grid item width="100%" display="flex" justifyItems="start">
                <Grid direction="column" display="flex" alignItems="center">
                    <UserAvatar user={existingUser} size={100} />
                    <Grid item>
                        <Button
                            onClick={() => {
                                setEditProfile(!editProfile);
                            }}
                            sx={{ color: darkMode ? 'white' : 'black', marginTop: '5px' }}
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
                                sx={{ justifyContent: 'center', color: darkMode ? 'white' : 'black', marginTop: '5px' }}
                            >
                                {i18next.t('user.cancel')}
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            {editProfile && (
                <Grid item>
                    <UserProfilePicker
                        user={existingUser}
                        onPick={(value: any) => {
                            setProfilePreference(value?.file ? { icon: value } : { profilePath: value });
                        }}
                        onDelete={() => setProfilePreference({})}
                        kartoffelProfile={kartoffelUserProfile}
                        imageName={isProfileFileType(existingUser.preferences.profilePath) ? existingUser.preferences.profilePath : undefined}
                        defaultInputType={defaultInputType(existingUser.preferences.profilePath)}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfile };
