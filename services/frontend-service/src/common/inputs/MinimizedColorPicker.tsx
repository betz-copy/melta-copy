import React, { CSSProperties, useRef, useState } from 'react';
import { IconButton, Popover } from '@mui/material';
import { Circle as CircleIcon, AddCircleOutline as AddColorIcons } from '@mui/icons-material';
import { ColorPicker, IColorPickerProps } from './ColorPicker';

interface IMinimizedColorPickerProps extends IColorPickerProps {
    circleSize: CSSProperties['width'];
}

export const MinimizedColorPicker: React.FC<IMinimizedColorPickerProps> = ({
    color,
    circleSize,
    style,
    onColorChange,
    ...restOfColorPickerProps
}) => {
    const circleRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
        <>
            <IconButton ref={circleRef} onClick={() => setOpen(true)} sx={{ padding: '0.1rem', ...style }}>
                {color ? <CircleIcon sx={{ color, fontSize: circleSize }} /> : <AddColorIcons sx={{ color: 'gray', fontSize: circleSize }} />}
            </IconButton>

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
