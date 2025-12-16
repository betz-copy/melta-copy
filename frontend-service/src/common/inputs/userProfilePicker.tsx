import { FileDetails, IUser } from '@microservices/shared';
import { Payment } from '@mui/icons-material';
import { Avatar, Box, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { environment } from '../../globals';
import { getKartoffelUserProfileRequest } from '../../services/userService';
import { allProfileAvatars } from '../../utils/icons';
import { getNameInitials } from '../../utils/userProfile';
import FileInput from './ImageFileInput';

type InputSelectType = 'chooseFile' | 'chooseAvatar' | 'kartoffelProfile';

export interface UserProfilePickerProps {
    user: IUser;
    onPick: (profileImage?: FileDetails | string) => void;
    onDelete: () => void;
    imageName?: string;
    defaultInputType?: InputSelectType;
    setUserProfileImage: React.Dispatch<React.SetStateAction<string | undefined>>;
    setIsDefaultProfile: React.Dispatch<React.SetStateAction<boolean>>;
}

const { kartoffelProfile } = environment.users;

const UserProfilePicker: React.FC<UserProfilePickerProps> = ({
    imageName,
    onPick,
    onDelete,
    defaultInputType,
    user,
    setUserProfileImage,
    setIsDefaultProfile,
}) => {
    const [inputType, setInputType] = useState(defaultInputType);
    const [fileInputValue, setFileInputValue] = useState<FileDetails | undefined>(
        imageName ? { file: { name: imageName }, name: imageName } : undefined,
    );
    const [selectedIcon, setSelectedIcon] = useState<string | undefined>(user.preferences.profilePath ?? undefined);
    const [kartoffelUserProfile, setKartoffelUserProfile] = useState<string>();

    const allAvatarPaths = allProfileAvatars;

    const handleToggleChange = (_event: React.MouseEvent<HTMLElement>, selected: InputSelectType | null) => {
        if (!selected) return;
        setInputType(selected);

        if (selected === kartoffelProfile) onPick(kartoffelProfile);
        else onPick(selected === 'chooseFile' ? fileInputValue : selectedIcon);
    };

    const handleIconClick = async (iconName?: string) => {
        setSelectedIcon(iconName ?? undefined);
        if (iconName) {
            const imageBlob = await fetch(`${environment.avatarIconPath}${iconName}`).then((res) => res.blob());
            const file = new File([imageBlob], iconName, { type: 'image/png' });
            setUserProfileImage(`${environment.avatarIconPath}${iconName}`);
            onPick({ file, name: file.name });
        } else {
            setUserProfileImage(undefined);
            setIsDefaultProfile(true);
            onPick();
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const kartoffelProfileImage = await getKartoffelUserProfileRequest(user?.kartoffelId);
                setKartoffelUserProfile(kartoffelProfileImage);
            } catch (error) {
                console.error('Failed to fetch Kartoffel user profile:', error);
            }
        };

        fetchUserProfile();
    }, [user]);

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid margin={0}>
                <ToggleButtonGroup value={inputType} exclusive onChange={handleToggleChange} sx={{ height: '2.5rem' }}>
                    <ToggleButton value="chooseAvatar" sx={{ width: '10.5rem' }}>
                        {i18next.t('input.imagePicker.chooseAvatar')}
                    </ToggleButton>
                    <ToggleButton value="chooseFile" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFile')}
                    </ToggleButton>
                    <ToggleButton
                        value="kartoffelProfile"
                        sx={{ width: '10rem', display: 'flex', justifyContent: 'space-evenly' }}
                        disabled={!kartoffelUserProfile}
                        onClick={() => {
                            setUserProfileImage(kartoffelUserProfile);
                        }}
                    >
                        {i18next.t('input.imagePicker.kartoffelProfile')}
                        {inputType === kartoffelProfile && <Payment />}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === 'chooseAvatar' && (
                <Grid>
                    <Box style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
                        <Grid container sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                            {allAvatarPaths.map((iconName, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Grid key={index} padding={2}>
                                    <Avatar
                                        src={`${environment.avatarIconPath}${iconName}`}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            cursor: 'pointer',
                                            boxShadow:
                                                selectedIcon === iconName ? '0px 4px 20px rgba(0, 0, 0, 1.5)' : '0px 4px 5px rgba(0, 0, 0, 0.5)',
                                            border: selectedIcon === iconName ? '2.5px solid green' : '',
                                        }}
                                        onClick={() => handleIconClick(iconName!)}
                                    />
                                </Grid>
                            ))}
                            <Grid padding={2}>
                                <Avatar
                                    style={{
                                        width: 50,
                                        height: 50,
                                        cursor: 'pointer',
                                        boxShadow: !selectedIcon ? '0px 4px 15px rgba(0, 0, 0, 1.5)' : '0px 4px 10px rgba(0, 0, 0, 0.5)',
                                        border: !selectedIcon ? '1px solid green' : '',
                                        backgroundColor: '#fcfeff',
                                        color: '#1E2775',
                                        overflow: 'hidden',
                                        maxWidth: '100%',
                                        font: `${Math.round(25)}px Rubik`,
                                        fontSize: Math.round(25),
                                        fontWeight: 500,
                                    }}
                                    onClick={() => handleIconClick()}
                                >
                                    {getNameInitials(user)}
                                </Avatar>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            )}
            {inputType === 'chooseFile' && (
                <Grid width="100%">
                    <FileInput
                        onDropFile={(acceptedFile) => {
                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };
                            setFileInputValue(detailedFile);
                            setUserProfileImage(URL.createObjectURL(acceptedFile));
                            onPick(detailedFile);
                        }}
                        onDeleteFile={(event: React.MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            setFileInputValue({} as FileDetails);
                            onDelete();
                        }}
                        file={fileInputValue?.file}
                        inputText={i18next.t('user.addFile')}
                        acceptedFilesTypes={{ 'image/png': ['.png', '.jpg'] }}
                        disablePreview
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfilePicker };
