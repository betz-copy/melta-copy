import { Avatar, Box, Grid, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import fileDetails from '../../interfaces/fileDetails';
import { IUser } from '../../interfaces/users';
import { getFileName } from '../../utils/getFileName';
import FileInput from './ImageFileInput';
import { environment } from '../../globals';

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

    const [fileInputValue, setFileInputValue] = useState<fileDetails | undefined>();
    const [iconPickerValue, setIconPickerValue] = useState<string>();
    const [image, setImage] = useState<{ name: string } | undefined>(undefined);
    const iconPaths = Array.from({ length: environment.profileIconsCount }, (_, index) => `/icons/profileAvatar/avatar${index}.png`);

    const onToggle = (_event: React.MouseEvent<HTMLElement>, selected: InputSelectType | null) => {
        if (!selected) return;
        setInputType(selected);

        const selectedValue = selected === 'chooseFile' ? fileInputValue : iconPickerValue;

        if (!selectedValue) {
            onDelete();
            return;
        }

        onPick(selectedValue);
    };
    const [selectedIcon, setSelectedIcon] = useState<string | null>(user.preferences.profilePath ?? null);

    const handleAvatarClick = (iconPath?: string) => {
        setIconPickerValue(iconPath);
        setSelectedIcon(iconPath ?? null);
        onPick(iconPath);
    };

    useEffect(() => {
        if (imageName) setImage({ name: getFileName(imageName) });
    }, []);

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <ToggleButtonGroup value={inputType} exclusive onChange={onToggle} sx={{ height: '2.5rem' }}>
                    <ToggleButton value="chooseAvatar" sx={{ width: '10rem' }}>
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
                    <Box style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                        <Grid container>
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
                            <Grid item padding={2}>
                                <Avatar
                                    src="/icons/profileAvatar/none.png"
                                    style={{
                                        width: 50,
                                        height: 50,
                                        cursor: 'pointer',
                                        boxShadow: !selectedIcon ? '0px 4px 15px rgba(0, 0, 0, 1.5)' : '0px 4px 10px rgba(0, 0, 0, 0.5)',
                                        border: !selectedIcon ? '1px solid green' : '',
                                    }}
                                    onClick={() => {
                                        handleAvatarClick(undefined);
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            )}
            {inputType === 'chooseFile' && (
                <Grid item>
                    <FileInput
                        fileFieldName="profileFile"
                        onDropFile={(acceptedFile) => {
                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };
                            setFileInputValue(detailedFile);
                            setImage({ name: detailedFile.name });
                            onPick(detailedFile);
                        }}
                        onDeleteFile={() => {
                            setFileInputValue(undefined);
                            setImage(undefined);
                            onDelete();
                        }}
                        file={image}
                        inputText={i18next.t('user.addFile')}
                        acceptedFilesTypes={{ 'image/png': ['.svg', '.png', '.jpeg'] }}
                        disableCamera
                        profileImageFile
                    />
                </Grid>
            )}
            {inputType === 'kartoffelProfile' && (
                <Grid padding="20px">
                    <Tooltip title={!kartoffelProfile ? i18next.t('user.kartoffelProfileNotExist') : ''}>
                        <IconButton
                            onClick={() => {
                                if (kartoffelProfile) handleAvatarClick(kartoffelProfile);
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
                    </Tooltip>
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfilePicker };
