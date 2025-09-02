import { Tooltip, TooltipProps, tooltipClasses } from '@mui/material';
import React from 'react';

const MeltaTooltip: React.FC<TooltipProps> = ({ children, ...tooltipProps }) => {
    return (
        <Tooltip
            {...tooltipProps}
            slotProps={{
                popper: {
                    sx: {
                        [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440', borderRadius: '10px', marginLeft: '5px' },
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
