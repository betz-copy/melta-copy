import React, { CSSProperties } from 'react';
import { IconButton, tooltipClasses } from '@mui/material';
import { MeltaTooltip } from './MeltaTooltip';

const IconButtonWithPopover: React.FC<{
    iconButtonProps?: React.ComponentProps<typeof IconButton>;
    popoverText: string;
    disabledToolTip?: boolean;
    style?: CSSProperties;
    disabled?: boolean;
    placement?:
        | 'bottom-end'
        | 'bottom-start'
        | 'bottom'
        | 'left-end'
        | 'left-start'
        | 'left'
        | 'right-end'
        | 'right-start'
        | 'right'
        | 'top-end'
        | 'top-start'
        | 'top';
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false, disabled, style, placement = 'bottom' }) => {
    return (
        <MeltaTooltip title={popoverText} disableHoverListener={disabledToolTip} placement={placement}>
            <span>
                <IconButton {...iconButtonProps} style={style} disabled={disabled}>
                    {children}
                </IconButton>
            </span>
        </MeltaTooltip>
    );
};

export default IconButtonWithPopover;
