import * as React from 'react';
import { useState } from 'react';
import { Box, Collapse, Divider, Typography } from '@mui/material';
import { MeltaCheckbox } from '../../MeltaCheckbox';

const InputAccordion = ({ children, label }) => {
    const [checked, setChecked] = useState(false);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" flexDirection="column" gap="5px">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MeltaCheckbox checked={checked} onChange={() => setChecked((prev) => !prev)} />
                    <Typography>{label}</Typography>
                </Box>
                <Collapse in={checked}>
                    <Box paddingX="10px" marginBottom="10px">
                        {children}
                    </Box>
                </Collapse>
            </Box>
            <Divider />
        </Box>
    );
};
export default InputAccordion;
