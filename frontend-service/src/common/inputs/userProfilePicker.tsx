import React, { useState } from 'react';
import { Grid, ToggleButtonGroup, ToggleButton, Avatar } from '@mui/material';
import i18next from 'i18next';
import FileInput from './ImageFileInput';
import fileDetails from '../../interfaces/fileDetails';

type InputSelectType = 'chooseFile' | 'chooseFromOptions' | 'kartoffelProfile';

export interface UserProfilePickerProps {
    image?: fileDetails;
    onPick: (image: fileDetails) => void;
    onDelete: () => void;
    defaultInputType?: InputSelectType;
    kartoffelProfile?: string;
}
const UserProfilePicker: React.FC<UserProfilePickerProps> = ({ image, onPick, onDelete, defaultInputType, kartoffelProfile }) => {
    const [inputType, setInputType] = useState(defaultInputType);

    const [fileInputValue, setFileInputValue] = useState<fileDetails | undefined>(image);
    const [iconPickerValue, setIconPickerValue] = useState<fileDetails>();

    const onToggle = (_event: React.MouseEvent<HTMLElement>, selected: InputSelectType | null) => {
        if (!selected) return;
        console.log({ selected });

        setInputType(selected);

        let selectedValue;
        if (selected === 'chooseFile') selectedValue = fileInputValue;
        if (selected === 'chooseFromOptions') selectedValue = iconPickerValue;
        if (selected === 'kartoffelProfile') {
            selectedValue = kartoffelProfile;
        }
        if (!selectedValue) {
            onDelete();
            return;
        }

        onPick(selectedValue);
    };
    console.log({ inputType, fileInputValue });

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <ToggleButtonGroup value={inputType} exclusive onChange={onToggle} sx={{ height: '2.5rem' }}>
                    <ToggleButton value="chooseFromOptions" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFromOptions')}
                    </ToggleButton>
                    <ToggleButton value="chooseFile" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFile')}
                    </ToggleButton>
                    <ToggleButton value="kartoffelProfile" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.kartoffelProfile')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === 'chooseFromOptions' && (
                <Grid item>
                    {/* <IconPicker
                        width="70rem"
                        height="21rem"
                        iconsPerPage={130}
                        selectedIconName={image?.name.split('.')[0]}
                        onPick={(icon) => {
                            const detailedFile = { file: icon, name: icon.name };

                            setIconPickerValue(detailedFile);
                            onPick(detailedFile);
                        }}
                        onDelete={() => {
                            setIconPickerValue(undefined);
                            onDelete();
                        }}
                    /> */}
                </Grid>
            )}
            {inputType === 'chooseFile' && (
                <Grid item>
                    <FileInput
                        fileFieldName="icon"
                        onDropFile={(acceptedFile) => {
                            console.log('droppp');

                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };

                            setFileInputValue(detailedFile);
                            onPick(detailedFile);
                        }}
                        onDeleteFile={() => {
                            setFileInputValue(undefined);
                            onDelete();
                        }}
                        fileName={fileInputValue?.name}
                        inputText={i18next.t('wizard.file')}
                        acceptedFilesTypes={{ 'image/png': ['.svg', '.png'] }}
                    />
                </Grid>
            )}
            {inputType === 'kartoffelProfile' && (
                <Grid padding="20px">
                    <Avatar src={kartoffelProfile ?? '/icons/arrow-more.svg'} />
                </Grid>
            )}
        </Grid>
    );
};

export { UserProfilePicker };
