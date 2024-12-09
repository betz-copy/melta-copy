import { Avatar, Box, Grid, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import fileDetails from '../../interfaces/fileDetails';
import { IUser } from '../../interfaces/users';
import FileInput from './ImageFileInput';
import { environment } from '../../globals';
import { getNameInitials } from '../../utils/userProfile';

type InputSelectType = 'chooseFile' | 'chooseAvatar' | 'kartoffelProfile';

export interface UserProfilePickerProps {
    imageName?: string;
    onPick: (profileImage: fileDetails | string | undefined) => void;
    onDelete: () => void;
    defaultInputType?: InputSelectType;
    kartoffelProfile?: string;
    user: IUser;
}

const UserProfilePicker: React.FC<UserProfilePickerProps> = ({ imageName, onPick, onDelete, defaultInputType, kartoffelProfile, user }) => {
    const [inputType, setInputType] = useState(defaultInputType);
    const [fileInputValue, setFileInputValue] = useState<fileDetails | undefined>(
        imageName ? { file: { name: imageName }, name: imageName } : undefined,
    );
    const [selectedIcon, setSelectedIcon] = useState<string | undefined>(user.preferences.profilePath ?? undefined);

    const icons = import.meta.glob('../../../public/icons/profileAvatar/*');

    const iconPaths = Object.keys(icons).map((filePath) => {
        const avatarName = filePath.split('/').pop();
        return `${environment.avatarIconPath}${avatarName}`;
    });

    const handleToggleChange = (_event: React.MouseEvent<HTMLElement>, selected: InputSelectType | null) => {
        if (!selected) return;
        setInputType(selected);
        onPick(selected === 'chooseFile' ? fileInputValue : selectedIcon);
    };

    const handleAvatarClick = (iconPath?: string) => {
        setSelectedIcon(iconPath ?? undefined);
        onPick(iconPath);
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
                    <ToggleButton value="kartoffelProfile" sx={{ width: '10rem' }} disabled={!kartoffelProfile}>
                        {i18next.t('input.imagePicker.kartoffelProfile')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === 'chooseAvatar' && (
                <Grid item>
                    <Box style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
                        <Grid container sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                            {iconPaths.map((iconPath, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Grid item key={index} padding={2}>
                                    <Avatar
                                        src={iconPath}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            cursor: 'pointer',
                                            boxShadow:
                                                selectedIcon === iconPath ? '0px 4px 20px rgba(0, 0, 0, 1.5)' : '0px 4px 5px rgba(0, 0, 0, 0.5)',
                                            border: selectedIcon === iconPath ? '2.5px solid green' : '',
                                        }}
                                        onClick={() => handleAvatarClick(iconPath)}
                                    />
                                </Grid>
                            ))}
                            <Grid item padding={2} onClick={() => handleAvatarClick()}>
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
                                    onClick={() => handleAvatarClick()}
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
                        fileFieldName="profileFile"
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
                    />
                </Grid>
            )}
            {inputType === 'kartoffelProfile' && (
                <Grid padding="20px">
                    <IconButton
                        onClick={() => {
                            handleAvatarClick('kartoffelProfile');
                        }}
                        style={{
                            width: 50,
                            height: 50,
                            cursor: 'pointer',
                            boxShadow: selectedIcon === 'kartoffelProfile' ? '0px 4px 10px rgba(0, 0, 0, 0.8)' : '',
                            border: selectedIcon === 'kartoffelProfile' ? '3px solid green' : '',
                        }}
                        disabled={!kartoffelProfile}
                    >
                        <Avatar
                            style={{
                                width: 50,
                                height: 50,
                                cursor: 'pointer',
                            }}
                            src={kartoffelProfile}
                        />
                    </IconButton>
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfilePicker };
