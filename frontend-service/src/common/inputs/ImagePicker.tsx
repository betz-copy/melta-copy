import { Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { FileDetails } from '@packages/common';
import i18next from 'i18next';
import React, { useState } from 'react';
import { InputPickerType } from '../../interfaces/inputs';
import IconPicker from './IconPicker';
import FileInput from './ImageFileInput';

interface ImagePickerProps {
    image?: FileDetails;
    onPick: (image: FileDetails) => void;
    onDelete: () => void;
    defaultInputType?: InputPickerType;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ image, onPick, onDelete, defaultInputType }) => {
    const [inputType, setInputType] = useState<InputPickerType | undefined>(defaultInputType);
    const [fileInputValue, setFileInputValue] = useState<FileDetails | undefined>(image);
    const [iconPickerValue, setIconPickerValue] = useState<FileDetails>();

    const onToggle = (_event: React.MouseEvent<HTMLElement>, selected: InputPickerType | null) => {
        if (!selected) return;

        setInputType(selected);

        const selectedValue = selected === InputPickerType.ChooseFile ? fileInputValue : iconPickerValue;

        if (!selectedValue) {
            onDelete();
            return;
        }

        onPick(selectedValue);
    };

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid>
                <ToggleButtonGroup value={inputType} exclusive onChange={onToggle} sx={{ height: '2.5rem' }}>
                    <ToggleButton value={InputPickerType.ChooseFromOptions} sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFromOptions')}
                    </ToggleButton>
                    <ToggleButton value={InputPickerType.ChooseFile} sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFile')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === InputPickerType.ChooseFromOptions && (
                <Grid>
                    <IconPicker
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
                    />
                </Grid>
            )}
            {inputType === InputPickerType.ChooseFile && (
                <Grid>
                    <FileInput
                        onDropFile={(acceptedFile) => {
                            const detailedFile = { file: acceptedFile, name: acceptedFile.name };
                            setFileInputValue(detailedFile);
                            onPick(detailedFile);
                        }}
                        onDeleteFile={() => {
                            setFileInputValue(undefined);
                            onDelete();
                        }}
                        file={image?.file}
                        inputText={i18next.t('wizard.file')}
                        acceptedFilesTypes={{ 'image/png': ['.svg', '.png'] }}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { ImagePicker };
