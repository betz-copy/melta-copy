import React, { CSSProperties, useEffect } from 'react';
import { Grid, IconButton } from '@mui/material';
import { SliderPicker } from 'react-color';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';

export interface IColorPickerProps {
    color?: string;
    onColorChange: (color?: string) => void;
    width: CSSProperties['width'];
    initialColor?: boolean;
    allowDelete?: boolean;
    style?: CSSProperties;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({ color, onColorChange, width, initialColor = true, allowDelete = true, style }) => {
    useEffect(() => {
        if (initialColor && !color) {
            onColorChange('#40bfbc');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid container direction="column" alignItems="center" sx={style}>
            <SliderPicker color={color} onChange={({ hex }) => onColorChange(hex)} styles={{ default: { hue: { width } } }} />

            {allowDelete && (
                <Grid item marginTop="0.8rem">
                    <IconButton onClick={() => onColorChange()} sx={{ padding: '0.4rem' }}>
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            )}
        </Grid>
    );
};
