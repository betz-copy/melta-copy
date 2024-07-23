import React, { CSSProperties } from 'react';
import { Grid, IconButton } from '@mui/material';
import { ChromePicker } from 'react-color';
import DoneIcon from '@mui/icons-material/Done';
import InvertColorsOffIcon from '@mui/icons-material/InvertColorsOff';

export interface IColorPickerProps {
    color?: string;
    onColorChange: (color?: string | undefined) => void;
    initialColor?: boolean;
    doneIcon?: boolean;
    style?: CSSProperties;
    onClose?: () => void;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({ color, onColorChange, doneIcon = false, style, onClose }) => {
    return (
        <Grid container direction="column" alignItems="center" sx={style}>
            <Grid style={{ direction: 'ltr' }}>
                <ChromePicker disableAlpha color={color} onChange={({ hex }) => onColorChange(hex)} />
            </Grid>
            <Grid item marginTop="0.8rem" display="flex">
                <IconButton
                    onClick={() => {
                        onColorChange();
                    }}
                    sx={{ padding: '0.4rem', justifyContent: 'flex-end' }}
                >
                    <InvertColorsOffIcon />
                </IconButton>
                {doneIcon && onClose && (
                    <IconButton
                        onClick={() => {
                            onClose();
                        }}
                        sx={{ padding: '0.4rem', justifyContent: 'flex-start' }}
                    >
                        <DoneIcon />
                    </IconButton>
                )}
            </Grid>
        </Grid>
    );
};
