import React, { CSSProperties } from 'react';
import { Chip } from '@mui/material';
import { colorWithOpacity } from '../utils/colorUtils';

interface ColoredEnumChipProps {
    label: string;
    color?: string | 'default';
    style?: CSSProperties;
    icon?: React.ReactElement;
    searchValue?: string;
}

export const ColoredEnumChip: React.FC<ColoredEnumChipProps> = ({ label, color, style, icon, searchValue }) => {
    const shouldHighlight = searchValue && label.toString().includes(searchValue);
    const textColor = color === 'default' ? '#000' : color;
    let backgroundColor;

    if (color !== 'default' && color) {
        backgroundColor = colorWithOpacity(color, shouldHighlight ? 0.25 : 0.1);
    } else {
        backgroundColor = shouldHighlight ? '#d3d1d1' : '#F7F7F7';
    }

    return (
        <Chip
            icon={icon}
            label={label}
            variant="outlined"
            sx={{
                height: '25px',
                borderRadius: '6px',
                border: 0,
                fontWeight: shouldHighlight ? '700' : '400',
                color: textColor,
                backgroundColor,
                fontFamily: 'Rubik',
                borderColor: color,
                ...style,
            }}
        />
    );
};
