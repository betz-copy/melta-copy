import { Grid, IconButton } from '@mui/material';
import { FileDetails } from '@packages/common';
import { IUser } from '@packages/user';
import i18next from 'i18next';
import React, { useState } from 'react';
import { defaultInputType, isProfileFile } from '../../../utils/userProfile';
import { UserProfilePicker } from '../../inputs/userProfilePicker';
import UserAvatar from '../../UserAvatar';

const UserProfile: React.FC<{
    existingUser: IUser;
    darkMode: boolean;
    editProfile: boolean;
    setEditProfile: (editProfile: boolean) => void;
    profilePreference: { profilePath?: string; icon?: FileDetails | string };
    setProfilePreference: (profilePreference: { profilePath?: string; icon?: FileDetails | string }) => void;
}> = ({ existingUser, editProfile, setProfilePreference, setEditProfile }) => {
    const [userProfileImage, setUserProfileImage] = useState<string>();
    const [isDefaultProfile, setIsDefaultProfile] = useState<boolean>(!existingUser.preferences.profilePath);

    return (
        <Grid container display="flex" justifyContent="center" padding={2}>
            <Grid width="100%" display="flex" justifyItems="start">
                <IconButton
                    onClick={() => {
                        setEditProfile(!editProfile);
                    }}
                >
                    <UserAvatar
                        userIcon={{ size: 100, profileImage: userProfileImage, isDefaultProfile: isDefaultProfile }}
                        shouldRenderChip={false}
                        tooltip={{
                            title: i18next.t(`user.${editProfile ? 'close' : 'edit'}`),
                            placement: 'left',
                            displayUserImage: false,
                        }}
                        user={existingUser}
                    />
                </IconButton>
            </Grid>

            {editProfile && (
                <Grid marginTop={2}>
                    <UserProfilePicker
                        user={existingUser}
                        // biome-ignore lint/suspicious/noExplicitAny: this code is bad
                        onPick={(value?: any) => setProfilePreference(value?.file ? { icon: value } : { profilePath: value })}
                        onDelete={() => setProfilePreference({})}
                        imageName={isProfileFile(existingUser.preferences.profilePath) ? existingUser.preferences.profilePath : undefined}
                        defaultInputType={defaultInputType(existingUser.preferences.profilePath)}
                        setUserProfileImage={setUserProfileImage}
                        setIsDefaultProfile={setIsDefaultProfile}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfile };
