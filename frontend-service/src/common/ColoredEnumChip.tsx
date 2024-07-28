import React, { CSSProperties } from 'react';
import { Chip } from '@mui/material';
import { colorWithOpacity } from '../utils/colorUtils';

interface ColoredEnumChipProps {
    label: string;
    color?: string | 'default';
    style?: CSSProperties;
    icon?: React.ReactElement;
}

export const ColoredEnumChip: React.FC<ColoredEnumChipProps> = ({ label, color, style, icon }) => {
    const backgroundColor = color !== 'default' && color ? colorWithOpacity(color, 0.1) : '#F7F7F7';
    const textColor = color === 'default' ? '#000' : color;
    return (
        <Chip
            icon={icon}
            label={label}
            variant="outlined"
            sx={{
                height: '25px',
                borderRadius: '6px',
                border: 0,
                fontWeight: '500',
                color: textColor,
                backgroundColor,
                fontFamily: 'Rubik',
                borderColor: color,
                ...style,
            }}
        />
    );
};
