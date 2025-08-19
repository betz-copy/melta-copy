import { Done, InvertColorsOff } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React, { CSSProperties } from 'react';
import { ChromePicker } from 'react-color';
import { useDarkModeStore } from '../../stores/darkMode';

export interface IColorPickerProps {
    color?: string;
    onColorChange: (color?: string | undefined) => void;
    initialColor?: boolean;
    doneIcon?: boolean;
    style?: CSSProperties;
    onClose?: () => void;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({ color, onColorChange, doneIcon = false, style, onClose }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid container direction="column" alignItems="center" sx={style}>
            <Grid style={{ direction: 'ltr' }}>
                <ChromePicker
                    disableAlpha
                    color={color}
                    onChange={({ hex }) => onColorChange(hex)}
                    styles={{ default: { body: { backgroundColor: darkMode ? '#2E2E2E' : '#fff' } } }}
                />
            </Grid>
            <Grid marginTop="0.8rem" display="flex">
                <IconButton
                    onClick={() => {
                        onColorChange();
                    }}
                    sx={{ padding: '0.4rem', justifyContent: 'flex-end' }}
                >
                    <InvertColorsOff />
                </IconButton>
                {doneIcon && onClose && (
                    <IconButton
                        onClick={() => {
                            onClose();
                        }}
                        sx={{ padding: '0.4rem', justifyContent: 'flex-start' }}
                    >
                        <Done />
                    </IconButton>
                )}
            </Grid>
        </Grid>
    );
};
