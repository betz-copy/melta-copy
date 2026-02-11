import { Box, Typography } from '@mui/material';
import React from 'react';

type CleanViewRowProps = {
    label?: React.ReactNode;
    value?: React.ReactNode;
    emptyValue?: React.ReactNode;
};

const getDisplayValue = (value: React.ReactNode, emptyValue: React.ReactNode) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return emptyValue;
    return value;
};

export const CleanViewRow: React.FC<CleanViewRowProps> = ({ label, value, emptyValue = '—' }) => {
    return (
        <Box display="flex" marginBottom={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: (theme) => theme.spacing(18), flexShrink: 0 }}>
                {label}:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                {getDisplayValue(value, emptyValue)}
            </Typography>
        </Box>
    );
};

export const CleanViewLabel: React.FC<Pick<CleanViewRowProps, 'label'>> = ({ label }) => (
    <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: (theme) => theme.spacing(18), flexShrink: 0, marginBottom: 1 }}>
        {label}
    </Typography>
);

export const isCleanView = (readonly?: boolean, formContext?: { viewMode?: string }) => Boolean(readonly && formContext?.viewMode === 'clean');
