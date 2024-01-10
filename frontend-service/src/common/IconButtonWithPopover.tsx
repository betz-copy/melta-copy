import React, { CSSProperties } from 'react';
import { IconButton, Tooltip, tooltipClasses } from '@mui/material';

const IconButtonWithPopover: React.FC<{
    iconButtonProps: React.ComponentProps<typeof IconButton>;
    popoverText: string;
    disabledToolTip?: boolean;
    style?: CSSProperties;
    disabled?: boolean;
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false, disabled, style }) => {
    return (
        <Tooltip
            title={popoverText}
            disableHoverListener={disabledToolTip}
            PopperProps={{
                sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
            }}
        >
            <span>
                <IconButton {...iconButtonProps} style={style} disabled={disabled}>
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithPopover;
