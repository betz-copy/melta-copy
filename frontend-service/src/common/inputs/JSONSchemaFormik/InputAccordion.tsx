import React, { useEffect, useState } from 'react';
import { Box, Collapse, SxProps, Theme, Typography } from '@mui/material';
import i18next from 'i18next';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { MeltaTooltip } from '../../MeltaTooltip';

const InputAccordion: React.FC<{ label: string; onChange; disabled?: boolean }> = ({ children, label, disabled, onChange }) => {
    const [checked, setChecked] = useState(false);

    const sx: SxProps<Theme> = disabled
        ? {
              color: 'grey',
              cursor: 'default',
          }
        : {};

    console.log({ disabled });

    useEffect(() => {
        if (!checked) {
            onChange(undefined);
        }
        
    }, [checked, onChange]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" flexDirection="column" gap="5px">
                <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
                    <MeltaTooltip title={disabled ? i18next.t('wizard.disabledField') : undefined}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MeltaCheckbox checked={checked} onChange={() => setChecked((prev) => !prev)} disabled={disabled} />
                            <Typography>{label}</Typography>
                        </Box>
                    </MeltaTooltip>
                </Box>
                <Collapse in={checked}>
                    <Box marginX="30px" marginBottom="10px">
                        {children}
                    </Box>
                </Collapse>
            </Box>
        </Box>
    );
};
export default InputAccordion;
