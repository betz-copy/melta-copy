import { Check, Remove } from '@mui/icons-material';
import { Box, Checkbox, useTheme } from '@mui/material';
import React from 'react';

interface MeltaCheckboxProps {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
}

const MeltaCheckbox: React.FC<MeltaCheckboxProps> = ({ checked, indeterminate, disabled, onChange }) => {
    const theme = useTheme();

    return (
        <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            disabled={disabled}
            onChange={onChange}
            checkedIcon={
                <Box
                    sx={{
                        borderRadius: '4px',
                        background: theme.palette.primary.main,
                        opacity: disabled ? 0.5 : 1,
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Check sx={{ color: '#fff', fontSize: '0.75rem' }} />
                </Box>
            }
            indeterminateIcon={
                <Box
                    sx={{
                        borderRadius: '4px',
                        background: theme.palette.primary.main,
                        opacity: disabled ? 0.5 : 1,
                        border: 'none',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Remove fontSize="small" sx={{ color: '#fff', fontSize: '0.75rem' }} />
                </Box>
            }
            icon={
                <Box
                    sx={{
                        borderRadius: '4px',
                        border: `1px solid ${theme.palette.primary.main}`,
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                />
            }
            sx={{ borderRadius: '4px', color: theme.palette.primary.main }}
        />
    );
};

export { MeltaCheckbox };
