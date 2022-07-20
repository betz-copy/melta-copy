import React, { CSSProperties } from 'react';
import { IconButton, Tooltip } from '@mui/material';

const IconButtonWithPopoverText: React.FC<{
    iconButtonProps: React.ComponentProps<typeof IconButton>;
    popoverText: string;
    disabledToolTip?: boolean;
    style?: CSSProperties;
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false, style }) => {
    return (
        <Tooltip title={popoverText} disableHoverListener={disabledToolTip} arrow>
            <span>
                <IconButton {...iconButtonProps} style={style}>
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithPopoverText;
