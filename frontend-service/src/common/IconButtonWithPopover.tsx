import React, { CSSProperties } from 'react';
import { IconButton, tooltipClasses } from '@mui/material';
import { MeltaTooltip } from './MeltaTooltip';

const IconButtonWithPopover: React.FC<{
    iconButtonProps?: React.ComponentProps<typeof IconButton>;
    popoverText: string;
    disabledToolTip?: boolean;
    style?: CSSProperties;
    disabled?: boolean;
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false, disabled, style }) => {
    return (
        <MeltaTooltip title={popoverText} disableHoverListener={disabledToolTip}>
            <span>
                <IconButton {...iconButtonProps} style={style} disabled={disabled}>
                    {children}
                </IconButton>
            </span>
        </MeltaTooltip>
    );
};

export default IconButtonWithPopover;
