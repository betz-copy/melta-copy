import React, { CSSProperties } from 'react';
import { Chip } from '@mui/material';
import { colorWithOpacity } from '../utils/colorUtils';

interface ColoredEnumChipProps {
    label: string;
    color: string;
    style?: CSSProperties;
}

export const ColoredEnumChip: React.FC<ColoredEnumChipProps> = ({ label, color, style }) => (
    <Chip
        label={label}
        variant="outlined"
        sx={{
            height: '25px',
            borderRadius: '6px',
            border: 0,
            fontWeight: '700',
            color,
            backgroundColor: colorWithOpacity(color, 0.16),
            fontFamily: 'Rubik',
            borderColor: color,
            ...style,
        }}
    />
);
