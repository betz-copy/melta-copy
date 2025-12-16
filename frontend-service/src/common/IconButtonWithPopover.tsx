import { IconButton, SxProps, Theme } from '@mui/material';
import React, { CSSProperties, ReactNode } from 'react';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';

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
    buttonStyle?: SxProps<Theme>;
    children?: ReactNode;
}> = ({ children, iconButtonProps, popoverText, disabledToolTip = false, disabled, style, placement = 'bottom', buttonStyle }) => {
    return (
        <MeltaTooltip title={popoverText} disableHoverListener={disabledToolTip} placement={placement}>
            <span>
                <IconButton {...iconButtonProps} style={style} disabled={disabled} sx={buttonStyle}>
                    <>{children}</>
                </IconButton>
            </span>
        </MeltaTooltip>
    );
};

export default IconButtonWithPopover;
