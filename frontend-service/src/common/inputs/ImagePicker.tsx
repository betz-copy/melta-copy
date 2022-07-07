import React, { useState } from 'react';
import { Grid, ToggleButtonGroup, ToggleButton } from '@mui/material';
import i18next from 'i18next';
import FileInput from './FileInput';
import IconPicker from './IconPicker';

type InputSelectType = 'chooseFile' | 'chooseFromOptions';

interface ImagePickerProps {
    image?: Partial<File>;
    setImage: (image: Partial<File> | null) => void;
    defaultInputType?: InputSelectType;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ image, setImage, defaultInputType }) => {
    const [inputType, setInputType] = useState(defaultInputType);

    const [fileInputValue, setFileInputValue] = useState<Partial<File> | null>(image || null);
    const [iconPickerValue, setIconPickerValue] = useState<Partial<File> | null>(null);

    const onToggle = (_event: React.MouseEvent<HTMLElement>, selected: InputSelectType | null) => {
        if (!selected) return;

        setInputType(selected);
        setImage(selected === 'chooseFromOptions' ? iconPickerValue : fileInputValue);
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
                        selectedIconName={iconPickerValue?.name?.split('.')[0]}
                        onPick={(icon) => {
                            setIconPickerValue(icon);
                            setImage(icon);
                        }}
                        onDelete={() => {
                            setIconPickerValue(null);
                            setImage(null);
                        }}
                    />
                </Grid>
            )}
            {inputType === 'chooseFile' && (
                <Grid item>
                    <FileInput
                        name="file"
                        onDropFile={(acceptedFile) => {
                            setFileInputValue(acceptedFile);
                            setImage(acceptedFile);
                        }}
                        onDeleteFile={() => {
                            setFileInputValue(null);
                            setImage(null);
                        }}
                        filePath={fileInputValue?.name}
                        inputText={i18next.t('wizard.file')}
                        acceptedFilesTypes="image/png"
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { ImagePicker };
