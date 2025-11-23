import { AddCircleOutline as AddColorIcons, Circle as CircleIcon } from '@mui/icons-material';
import { IconButton, Popover, Typography } from '@mui/material';
import React, { CSSProperties, useRef, useState } from 'react';
import { ColorPicker, IColorPickerProps } from './ColorPicker';

interface IMinimizedColorPickerProps extends IColorPickerProps {
    circleSize: CSSProperties['width'];
    error?: boolean;
    helperText?: string;
}

export const MinimizedColorPicker: React.FC<IMinimizedColorPickerProps> = ({
    color,
    circleSize,
    style,
    onColorChange,
    error,
    helperText,
    ...restOfColorPickerProps
}) => {
    const circleRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
        <>
            <IconButton ref={circleRef} onClick={() => setOpen(true)} sx={{ padding: '0.1rem', ...style }}>
                {color ? (
                    <CircleIcon sx={{ color: error ? '#d32f2f' : color, fontSize: circleSize }} />
                ) : (
                    <AddColorIcons sx={{ color: error ? '#d32f2f' : 'gray', fontSize: circleSize }} />
                )}
            </IconButton>

            {helperText && (
                <Typography variant="caption" color={error ? 'error' : 'textSecondary'} sx={{ marginTop: '0.4rem' }}>
                    {helperText}
                </Typography>
            )}

            <Popover
                open={open}
                anchorEl={circleRef.current}
                onClose={() => setOpen(false)}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
            >
                <ColorPicker
                    color={color}
                    onColorChange={(newColor) => {
                        onColorChange(newColor);
                    }}
                    onClose={() => setOpen(false)}
                    {...restOfColorPickerProps}
                    style={{ padding: '1rem' }}
                    doneIcon
                />
            </Popover>
        </>
    );
};
