import React, { CSSProperties, useEffect, useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { ChromePicker } from 'react-color';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import DoneIcon from '@mui/icons-material/Done';

export interface IColorPickerProps {
    color?: string;
    onColorChange: (color?: string) => void;
    initialColor?: boolean;
    deleteAndDoneIcons?: boolean;
    style?: CSSProperties;
    onClose?: () => void;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({
    color,
    onColorChange,
    initialColor = true,
    deleteAndDoneIcons = true,
    style,
    onClose,
}) => {
    const [selectedColor, setSelectedColor] = useState(color || '#40bfbc');

    useEffect(() => {
        if (initialColor && !color) {
            onColorChange('#40bfbc');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChangeColor = (hex: string) => {
        setSelectedColor(hex);
        onColorChange(hex);
    };

    return (
        <Grid container direction="column" alignItems="center" sx={style}>
            <Grid style={{ direction: 'ltr' }}>
                <ChromePicker disableAlpha color={color} onChange={({ hex }) => handleChangeColor(hex)} />
            </Grid>

            {deleteAndDoneIcons && (
                <Grid item marginTop="0.8rem">
                    <IconButton
                        onClick={() => {
                            onColorChange(selectedColor);
                            onClose!();
                        }}
                        sx={{ padding: '0.4rem' }}
                    >
                        <DoneIcon />
                    </IconButton>
                    <IconButton onClick={() => onClose!()} sx={{ padding: '0.4rem' }}>
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            )}
        </Grid>
    );
};
