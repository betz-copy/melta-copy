import { Tooltip, TooltipProps, tooltipClasses } from '@mui/material';
import React from 'react';

export enum TooltipVariant {
    Default = 'default',
    Bubble = 'bubble',
}

interface CustomTooltipProps extends TooltipProps {
    sxColor?: object;
    variant?: TooltipVariant;
}

const MeltaTooltip: React.FC<CustomTooltipProps> = ({ children, variant = TooltipVariant.Default, ...tooltipProps }) => {
    const defaultSx = {
        fontSize: '1rem',
        backgroundColor: '#101440',
        borderRadius: '10px',
        marginLeft: '5px',
    };

    const bubbleSx = {
        fontSize: '1rem',
        backgroundColor: '#fff',
        color: '#787C9E',
        borderRadius: '10px',
        boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
        padding: '8px 12px',
        marginLeft: '0px',
        position: 'relative',
        maxWidth: '450px',
    };

    return (
        <Tooltip
            {...tooltipProps}
            placement={variant === 'bubble' ? 'top' : undefined}
            slotProps={{
                popper: {
                    sx: {
                        [`& .${tooltipClasses.tooltip}`]: variant === 'bubble' ? bubbleSx : defaultSx,
                    },
                    ...tooltipProps.slotProps?.popper,
                },
            }}
        >
            {children}
        </Tooltip>
    );
};

export default MeltaTooltip;
