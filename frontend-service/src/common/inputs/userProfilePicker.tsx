import React, { useState } from 'react';
import { Grid, ToggleButtonGroup, ToggleButton, Avatar, Box, Tooltip, IconButton } from '@mui/material';
import i18next from 'i18next';
import FileInput from './ImageFileInput';
import fileDetails from '../../interfaces/fileDetails';
import UserAvatar, { getNameInitials } from '../UserAvatar';
import { IUser } from '../../interfaces/users';

type InputSelectType = 'chooseFile' | 'chooseAvatar' | 'kartoffelProfile';

export interface UserProfilePickerProps {
    image?: string;
    onPick: (profileImage: fileDetails | string | undefined) => void;
    onDelete: () => void;
    defaultInputType?: InputSelectType;
    kartoffelProfile?: string;
    user: IUser;
}
const UserProfilePicker: React.FC<UserProfilePickerProps> = ({ image, onPick, onDelete, defaultInputType, kartoffelProfile, user }) => {
    const [inputType, setInputType] = useState(defaultInputType);

    const [fileInputValue, setFileInputValue] = useState<fileDetails | undefined>();
    const [iconPickerValue, setIconPickerValue] = useState<string>();

    const iconPaths = [
        '/icons/profileAvatar/c.png',
        '/icons/profileAvatar/avatar1.png',
        '/icons/profileAvatar/avatar2.png',
        '/icons/profileAvatar/avatar3.png',
        '/icons/profileAvatar/avatar4.png',
        '/icons/profileAvatar/avatar5.png',
        '/icons/profileAvatar/avatar6.png',
        '/icons/profileAvatar/avatar7.png',
        '/icons/profileAvatar/avatar8.png',
        '/icons/profileAvatar/avatar9.png',
        '/icons/profileAvatar/avatar10.png',
    ];
    const onToggle = (_event: React.MouseEvent<HTMLElement>, selected: InputSelectType | null) => {
        if (!selected) return;
        setInputType(selected);

        const selectedValue = selected === 'chooseFile' ? fileInputValue : iconPickerValue;
        // if (selected === 'chooseFile') selectedValue = ;
        // if (selected === 'chooseAvatar') selectedValue = ;
        // if (selected === 'kartoffelProfile') {
        //     selectedValue = kartoffelProfile ?? undefined;
        // }
        console.log({ selectedValue });

        if (!selectedValue) {
            onDelete();
            return;
        }

        onPick(selectedValue);
    };
    console.log({ inputType, fileInputValue, image });
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

    const handleAvatarClick = (iconPath?: string) => {
        console.log('noticeeeeeee', { iconPath });

        setIconPickerValue(iconPath);
        setSelectedIcon(iconPath ?? '');
        onPick(iconPath);
    };

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
                    <ToggleButton value="kartoffelProfile" sx={{ width: '10rem' }}>
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
                                                selectedIcon === iconPath ? '0px 4px 15px rgba(0, 0, 0, 1.5)' : '0px 4px 5px rgba(0, 0, 0, 0.5)',

                                            border: selectedIcon === iconPath ? '1.5px solid green' : '',
                                        }}
                                        onClick={() => handleAvatarClick(iconPath)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Grid>
            )}
            {inputType === 'chooseFile' && (
                <Grid item>
                    <FileInput
                        fileFieldName="icon"
                        onDropFile={(acceptedFile) => {
                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };
                            setFileInputValue(detailedFile);
                            console.log('1');

                            onPick(detailedFile);
                            console.log('2');
                        }}
                        onDeleteFile={() => {
                            setFileInputValue(undefined);
                            onDelete();
                        }}
                        fileName={image}
                        inputText={i18next.t('wizard.file')}
                        acceptedFilesTypes={{ 'image/png': ['.svg', '.png'] }}
                    />
                </Grid>
            )}
            {inputType === 'kartoffelProfile' && (
                <Grid padding="20px">
                    <IconButton
                        onClick={() => {
                            setSelectedIcon('default');
                            handleAvatarClick(undefined);
                        }}
                        sx={{
                            // boxShadow: selectedIcon === 'default' ? '0px 4px 15px rgba(0, 0, 0, 1.5)' : '0px 4px 10px rgba(0, 0, 0, 0.5)',
                            border: selectedIcon === 'default' ? '1px solid black' : '',
                        }}
                    >
                        <UserAvatar user={user} defaultProfile />
                    </IconButton>
                    <Tooltip title={!kartoffelProfile ? 'תמונת חוגר אינה קיימת' : ''}>
                        <IconButton
                            // disabled={!kartoffelProfile}
                            onClick={() => {
                                if (kartoffelProfile) {
                                    setSelectedIcon('kartoffelProfile');
                                    handleAvatarClick(kartoffelProfile);
                                }
                            }}
                        >
                            <Avatar
                                style={{
                                    width: 50,
                                    height: 50,
                                    cursor: 'pointer',
                                    boxShadow:
                                        selectedIcon === 'kartoffelProfile' ? '0px 4px 15px rgba(0, 0, 0, 1.5)' : '0px 4px 10px rgba(0, 0, 0, 0.5)',
                                    border: selectedIcon === 'kartoffelProfile' ? '1px solid black' : '',
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
