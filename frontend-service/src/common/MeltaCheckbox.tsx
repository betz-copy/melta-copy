import { Box, Checkbox } from '@mui/material';
import React from 'react';

interface MeltaCheckboxProps {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
}

const MeltaCheckbox: React.FC<MeltaCheckboxProps> = ({ checked, indeterminate, disabled, onChange }) => {
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
                        background: disabled ? '#9398C2' : '#4752B6',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <img src="/icons/checked-icon.svg" style={{ width: '9.33px', height: '6.42px' }} />
                </Box>
            }
            indeterminateIcon={
                <Box
                    sx={{
                        borderRadius: '4px',
                        background: disabled ? '#9398C2' : '#4752B6',
                        border: 'none',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <img src="/icons/not-checked-icon.svg" style={{ width: '11px', height: '14px' }} />
                </Box>
            }
            icon={
                <Box
                    sx={{
                        borderRadius: '4px',
                        border: disabled ? '1px solid #9398C2' : '1px solid #4752B6',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                />
            }
            sx={{ borderRadius: '4px', color: '#4752B6' }}
        />
    );
};

export { MeltaCheckbox };
