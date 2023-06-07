import React, { CSSProperties } from 'react';
import { IconButton, Tooltip } from '@mui/material';

const IconButtonWithPopover: React.FC<{
    iconButtonProps: React.ComponentProps<typeof IconButton>;
    popoverText: string;
    disabledToolTip?: boolean;
    style?: CSSProperties;
    disabled?: boolean;
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false, disabled = false, style }) => {
    return (
        <Tooltip title={popoverText} disableHoverListener={disabledToolTip} arrow>
            <span>
                <IconButton {...iconButtonProps} style={style} disabled={disabled}>
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithPopover;
