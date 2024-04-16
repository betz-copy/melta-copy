import React, { CSSProperties, useEffect } from 'react';
import { Grid, IconButton } from '@mui/material';
import { ChromePicker } from 'react-color';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';

export interface IColorPickerProps {
    color?: string;
    onColorChange: (color?: string) => void;
    initialColor?: boolean;
    allowDelete?: boolean;
    style?: CSSProperties;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({ color, onColorChange, initialColor = true, allowDelete = true, style }) => {
    useEffect(() => {
        if (initialColor && !color) {
            onColorChange('#40bfbc');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid container direction="column" alignItems="center" sx={style}>
            <Grid style={{ direction: 'ltr' }}>
                <ChromePicker disableAlpha color={color} onChange={({ hex }) => onColorChange(hex)} />
            </Grid>
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
