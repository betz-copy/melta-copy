import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

const IconButtonWithPopoverText: React.FC<{
    iconButtonProps: React.ComponentProps<typeof IconButton>;
    popoverText: string;
    disabledToolTip?: boolean;
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false }) => {
    return (
        <Tooltip title={popoverText} followCursor disableHoverListener={disabledToolTip}>
            <span>
                <IconButton {...iconButtonProps}>{children}</IconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithPopoverText;
