import { AddCircle } from '@mui/icons-material';
import { IconButton, Typography, useTheme } from '@mui/material';
import React from 'react';

export const CreateButton: React.FC<{ onClick: () => void; text: string }> = ({ onClick, text }) => {
    const theme = useTheme();

    return (
        <IconButton sx={{ display: 'flex', gap: '0.25rem', borderRadius: '5px', width: 'fit-content' }} onClick={onClick}>
            <AddCircle color="primary" />
            <Typography color={theme.palette.primary.main} sx={{ fontSize: '0.9rem' }}>
                {text}
            </Typography>
        </IconButton>
    );
};
