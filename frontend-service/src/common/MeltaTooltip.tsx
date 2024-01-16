import { Tooltip, TooltipProps, tooltipClasses } from '@mui/material';
import React from 'react';

const MeltaTooltip: React.FC<TooltipProps> = ({ children, ...tooltipProps }) => {
    return (
        <Tooltip
            {...tooltipProps}
            PopperProps={{
                sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
            }}
        >
            {children}
        </Tooltip>
    );
};

export { MeltaTooltip };
