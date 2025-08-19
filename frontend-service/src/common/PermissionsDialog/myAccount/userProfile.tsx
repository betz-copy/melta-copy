import { Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IUser } from '../../../interfaces/users';
import { defaultInputType, isProfileFile } from '../../../utils/userProfile';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import UserAvatar from '../../UserAvatar';
import { UserProfilePicker } from '../../inputs/userProfilePicker';

const UserProfile: React.FC<{
    existingUser: IUser;
    darkMode: boolean;
    editProfile: boolean;
    setEditProfile: (editProfile: boolean) => void;
    profilePreference: { profilePath?: string; icon?: any };
    setProfilePreference: (profilePreference: { profilePath?: string; icon?: any }) => void;
}> = ({ existingUser, editProfile, setProfilePreference, setEditProfile }) => {
    const [userProfileImage, setUserProfileImage] = useState<string>();
    const [isDefaultProfile, setIsDefaultProfile] = useState<boolean>(false);

    return (
        <Grid container display="flex" justifyContent="center" padding={2}>
            <Grid width="100%" display="flex" justifyItems="start">
                <MeltaTooltip title={i18next.t(`user.${editProfile ? 'close' : 'edit'}`)} placement="left">
                    <IconButton
                        onClick={() => {
                            setEditProfile(!editProfile);
                        }}
                    >
                        <UserAvatar
                            user={existingUser}
                            size={100}
                            userProfileImage={userProfileImage}
                            isDefaultProfile={isDefaultProfile}
                            addBorder
                        />
                    </IconButton>
                </MeltaTooltip>
            </Grid>

            {editProfile && (
                <Grid marginTop={2}>
                    <UserProfilePicker
                        user={existingUser}
                        onPick={(value?: any) => {
                            setProfilePreference(value?.file ? { icon: value } : { profilePath: value });
                        }}
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
