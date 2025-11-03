import { Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import fileDetails from '../../interfaces/fileDetails';
import IconPicker from './IconPicker';
import FileInput from './ImageFileInput';

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
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid>
                <ToggleButtonGroup value={inputType} exclusive onChange={onToggle} sx={{ height: '2.5rem' }}>
                    <ToggleButton value="chooseFromOptions" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFromOptions')}
                    </ToggleButton>
                    <ToggleButton value="chooseFile" sx={{ width: '10rem' }}>
                        {i18next.t('input.imagePicker.chooseFile')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            {inputType === 'chooseFromOptions' && (
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
            {inputType === 'chooseFile' && (
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
