import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { CSSProperties } from 'react';
import { colorWithOpacity } from '../utils/colorUtils';

interface ColoredEnumChipProps {
    label: string;
    enumColor?: string | 'default';
    style?: CSSProperties;
    icon?: React.ReactElement;
    searchValue?: string;
    onDelete?: React.EventHandler<any>;
    deleteIcon?: React.ReactElement;
    color?: string;
}

export const ColoredEnumChip: React.FC<ColoredEnumChipProps> = ({ label, enumColor, style, icon, searchValue, onDelete, deleteIcon, color }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const shouldHighlight = Boolean(searchValue && label?.toString().includes(searchValue));
    const textColor = color ?? (enumColor === 'default' ? (isDarkMode ? '#fff' : '#000') : enumColor);

    let backgroundColor: string;
    if (enumColor !== 'default' && enumColor) backgroundColor = colorWithOpacity(enumColor, shouldHighlight ? 0.25 : 0.1);
    else {
        if (isDarkMode) backgroundColor = shouldHighlight ? '#4F4F4F' : '#303030';
        else backgroundColor = shouldHighlight ? '#d3d1d1' : '#F7F7F7';
    }

    return (
        <Chip
            icon={icon}
            label={label}
            variant="outlined"
            onDelete={onDelete}
            deleteIcon={deleteIcon}
            sx={{
                height: '25px',
                borderRadius: '5px',
                border: 0,
                fontWeight: shouldHighlight ? 700 : 400,
                color: textColor,
                backgroundColor,
                fontFamily: 'Rubik',
                borderColor: enumColor,
                ...style,
            }}
        />
    );
};
