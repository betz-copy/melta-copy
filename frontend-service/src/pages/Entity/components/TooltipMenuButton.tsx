import React from 'react';
import { Tooltip, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import { MeltaTooltip } from '../../../common/MeltaTooltip';

interface TooltipMenuButtonProps {
    tooltipTitle: string;
    onClick: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
    disabled: boolean;
    icon: SvgIconComponent;
    text: string;
}

const TooltipMenuButton: React.FC<TooltipMenuButtonProps> = ({ tooltipTitle, onClick, disabled, icon: Icon, text }) => {
    return (
        <MeltaTooltip title={tooltipTitle} disableHoverListener={!disabled} placement="right">
            <span>
                <MenuItem onClick={onClick} disabled={disabled}>
                    <ListItemIcon>
                        <Icon />
                    </ListItemIcon>
                    <ListItemText primary={text} />
                </MenuItem>
            </span>
        </MeltaTooltip>
    );
};

export default TooltipMenuButton;
