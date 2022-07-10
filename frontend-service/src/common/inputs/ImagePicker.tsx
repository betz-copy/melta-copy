import React, { useState } from 'react';
import { Grid, ToggleButtonGroup, ToggleButton } from '@mui/material';
import i18next from 'i18next';
import FileInput from './FileInput';
import IconPicker from './IconPicker';
import fileDetails from '../../interfaces/fileDetails';

type InputSelectType = 'chooseFile' | 'chooseFromOptions';

interface ImagePickerProps {
    image?: fileDetails;
    onPick: (image: fileDetails) => void;
    onDelete: () => void;
    defaultInputType?: InputSelectType;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ image, onPick, onDelete, defaultInputType }) => {
    const [inputType, setInputType] = useState(defaultInputType);

    const [fileInputValue, setFileInputValue] = useState<fileDetails | undefined>(image);
    const [iconPickerValue, setIconPickerValue] = useState<fileDetails>();

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

    return (
        <Grid container direction="column" alignItems="center" spacing={2}>
            <Grid item>
                <ToggleButtonGroup value={inputType} exclusive onChange={onToggle}>
                    <ToggleButton value="chooseFromOptions" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFromOptions')}
                    </ToggleButton>
                    <ToggleButton value="chooseFile" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFile')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === 'chooseFromOptions' && (
                <Grid item>
                    <IconPicker
                        width="30rem"
                        height="24.5rem"
                        iconsPerPage={60}
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
                    />
                </Grid>
            )}
            {inputType === 'chooseFile' && (
                <Grid item>
                    <FileInput
                        name="icon"
                        onDropFile={(acceptedFile) => {
                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };

                            setFileInputValue(detailedFile);
                            onPick(detailedFile);
                        }}
                        onDeleteFile={() => {
                            setFileInputValue(undefined);
                            onDelete();
                        }}
                        fileName={image?.name}
                        inputText={i18next.t('wizard.file')}
                        acceptedFilesTypes="image/png"
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { ImagePicker };
