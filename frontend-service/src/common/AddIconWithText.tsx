import { AddCircle } from '@mui/icons-material';
import { Typography } from '@mui/material';
import React, { forwardRef } from 'react';

interface AddIconWithTextProps {
    textStyle: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    ref?: React.RefObject<HTMLParagraphElement>;
    text?: string;
    disabled: boolean;
}
export const AddIconWithText = forwardRef<HTMLDivElement, AddIconWithTextProps>(({ textStyle, onClick, text, disabled }, ref) => {
    return (
        <Typography onClick={onClick} ref={ref} component="p" color={disabled ? 'gray' : 'primary'} justifyContent="space-around" style={textStyle}>
            <AddCircle sx={{ opacity: disabled ? 0.3 : 1, marginRight: '0.5rem' }} />
            {text}
        </Typography>
    );
});
