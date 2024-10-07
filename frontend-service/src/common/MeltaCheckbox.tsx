import { Check, Remove } from '@mui/icons-material';
import { Box, Checkbox, SxProps } from '@mui/material';
import React, { CSSProperties } from 'react';

interface MeltaCheckboxProps {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    sxChecked?: SxProps<any>;
    sxIndeterminate?: SxProps<any>;
    sxEmpty?: SxProps<any>;
    sxIcon?: CSSProperties;
}

const MeltaCheckbox: React.FC<MeltaCheckboxProps> = ({ checked, indeterminate, disabled, onChange, sxChecked, sxIndeterminate, sxEmpty, sxIcon }) => {
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
                        ...sxChecked,
                    }}
                >
                    <Check style={{ width: '14px', height: '14px', color: 'white', ...sxIcon }} />
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
                        ...sxIndeterminate,
                    }}
                >
                    <Remove style={{ width: '14px', height: '14px', color: 'white', ...sxIcon }} />
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
                        ...sxEmpty,
                    }}
                />
            }
            sx={{ borderRadius: '4px', color: '#4752B6' }}
        />
    );
};

export { MeltaCheckbox };
