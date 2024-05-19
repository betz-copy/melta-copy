import { Typography } from '@mui/material';
import React, { forwardRef } from 'react';
import { ImageWithDisable } from './ImageWithDisable';

interface AddIconWithTextProps {
    textStyle: React.CSSProperties;
    onClick?: () => void;
    ref?: React.RefObject<HTMLParagraphElement>;
    text?: string;
    disabled?: boolean;
    iconStyle: React.CSSProperties;
}

export const AddIconWithText = forwardRef<HTMLDivElement, AddIconWithTextProps>(({ textStyle, onClick, text, disabled = false, iconStyle }, ref) => {
    return (
        <Typography
            onClick={onClick}
            ref={ref}
            component="div"
            color={disabled ? 'gray' : 'primary'}
            justifyContent="space-around"
            style={{ ...textStyle, cursor: 'pointer' }}
        >
            <ImageWithDisable srcPath="/icons/icon-plus.svg" disabled={disabled} style={iconStyle} />
            {text}
        </Typography>
    );
});
