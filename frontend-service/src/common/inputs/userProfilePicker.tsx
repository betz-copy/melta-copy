import { Avatar, Box, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import PaymentIcon from '@mui/icons-material/Payment';
import fileDetails from '../../interfaces/fileDetails';
import { IUser } from '../../interfaces/users';
import FileInput from './ImageFileInput';
import { getNameInitials } from '../../utils/userProfile';
import { allProfileAvatars } from '../../utils/icons';
import { environment } from '../../globals';

type InputSelectType = 'chooseFile' | 'chooseAvatar' | 'kartoffelProfile';

export interface UserProfilePickerProps {
    imageName?: string;
    onPick: (profileImage?: fileDetails | string) => void;
    onDelete: () => void;
    defaultInputType?: InputSelectType;
    user: IUser;
}

const { kartoffelProfile } = environment.users;

const UserProfilePicker: React.FC<UserProfilePickerProps> = ({ imageName, onPick, onDelete, defaultInputType, user }) => {
    const [inputType, setInputType] = useState(defaultInputType);
    const [fileInputValue, setFileInputValue] = useState<fileDetails | undefined>(
        imageName ? { file: { name: imageName }, name: imageName } : undefined,
    );
    const [selectedIcon, setSelectedIcon] = useState<string | undefined>(user.preferences.profilePath ?? undefined);

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
            onPick({ file, name: file.name });
        } else onPick();
    };

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item margin={0}>
                <ToggleButtonGroup value={inputType} exclusive onChange={handleToggleChange} sx={{ height: '2.5rem' }}>
                    <ToggleButton value="chooseAvatar" sx={{ width: '10.5rem' }}>
                        {i18next.t('input.imagePicker.chooseAvatar')}
                    </ToggleButton>
                    <ToggleButton value="chooseFile" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFile')}
                    </ToggleButton>
                    <ToggleButton value="kartoffelProfile" sx={{ width: '10rem', display: 'flex', justifyContent: 'space-evenly' }}>
                        {i18next.t('input.imagePicker.kartoffelProfile')}
                        {inputType === kartoffelProfile && <PaymentIcon />}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === 'chooseAvatar' && (
                <Grid item>
                    <Box style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
                        <Grid container sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                            {allAvatarPaths.map((iconName, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Grid item key={index} padding={2}>
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
                            <Grid item padding={2}>
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
                <Grid item width="50%">
                    <FileInput
                        onDropFile={(acceptedFile) => {
                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };
                            setFileInputValue(detailedFile);
                            onPick(detailedFile);
                        }}
                        onDeleteFile={(event: React.MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            setFileInputValue({} as fileDetails);
                            onDelete();
                        }}
                        file={fileInputValue?.file}
                        inputText={i18next.t('user.addFile')}
                        acceptedFilesTypes={{ 'image/png': ['.png', '.jpg'] }}
                        disableCamera
                        disablePreview
                        disableScanner
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfilePicker };
