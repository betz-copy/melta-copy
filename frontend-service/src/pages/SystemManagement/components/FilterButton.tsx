import { FilterList, FilterListOff } from '@mui/icons-material';
import { IconButton, Typography, useTheme } from '@mui/material';
import React from 'react';

export const FilterButton: React.FC<{ onClick: () => void; text: string; disabled: boolean; displayIcon?: boolean }> = ({
    onClick,
    text,
    disabled,
    displayIcon = true,
}) => {
    const theme = useTheme();

    return (
        <IconButton
            style={{
                borderRadius: '5px',
                display: 'flex',
                gap: '0.25rem',
                fontSize: '0.75rem',
                opacity: disabled ? 0.5 : 1,
            }}
            onClick={onClick}
            disabled={disabled}
        >
            {displayIcon && (disabled ? <FilterListOff color="primary" fontSize="small" /> : <FilterList color="primary" fontSize="small" />)}
            <Typography color={theme.palette.primary.main} sx={{ fontSize: '0.9rem' }}>
                {text}
            </Typography>
        </IconButton>
    );
};
