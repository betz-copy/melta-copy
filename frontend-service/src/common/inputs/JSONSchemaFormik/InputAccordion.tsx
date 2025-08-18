import { Box, Collapse, SxProps, Theme, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { Dispatch, SetStateAction } from 'react';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';

const InputAccordion: React.FC<{ label: string; disabled?: boolean; setChecked: Dispatch<SetStateAction<boolean>>; checked: boolean }> = ({
    children,
    label,
    disabled,
    setChecked,
    checked,
}) => {
    const sx: SxProps<Theme> = disabled
        ? {
              color: 'grey',
              cursor: 'default',
          }
        : {};

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" flexDirection="column" gap="5px">
                <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
                    <MeltaTooltip title={disabled ? i18next.t('wizard.disabledField') : undefined} sx={{ marginRight: '120px' }}>
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
