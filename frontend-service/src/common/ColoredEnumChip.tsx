import React, { CSSProperties } from 'react';
import { Chip } from '@mui/material';

interface ColoredEnumChipProps {
    label: string;
    color: string;
    style?: CSSProperties;
}

export const ColoredEnumChip: React.FC<ColoredEnumChipProps> = ({ label, color, style }) => (
    <Chip label={label} variant="outlined" sx={{ borderColor: color, color, fontWeight: '500', borderWidth: '2px', fontFamily: 'Rubik', ...style }} />
);
