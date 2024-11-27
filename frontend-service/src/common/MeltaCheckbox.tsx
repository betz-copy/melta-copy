import { Check, Remove } from '@mui/icons-material';
import { Box, Checkbox, SxProps, useTheme } from '@mui/material';
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
    width?: string;
    height?: string;
}

const MeltaCheckbox: React.FC<MeltaCheckboxProps> = ({
    checked,
    indeterminate,
    disabled,
    onChange,
    sxChecked,
    sxIndeterminate,
    sxEmpty,
    sxIcon,
    width,
    height,
}) => {
    const theme = useTheme();

    const checkboxSx: SxProps = {
        borderRadius: '4px',
        width: width || '20px',
        height: height || '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    return (
        <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            disabled={disabled}
            onChange={onChange}
            checkedIcon={
                <Box
                    sx={{
                        ...checkboxSx,
                        background: theme.palette.primary.main,
                        opacity: disabled ? 0.5 : 1,
                        ...sxChecked,
                    }}
                >
                    <Check sx={{ color: '#fff', fontSize: '0.75rem', ...sxIcon }} />
                </Box>
            }
            indeterminateIcon={
                <Box
                    sx={{
                        ...checkboxSx,
                        background: theme.palette.primary.main,
                        opacity: disabled ? 0.5 : 1,
                        border: 'none',
                        ...sxIndeterminate,
                    }}
                >
                    <Remove fontSize="small" sx={{ color: '#fff', fontSize: '0.75rem', ...sxIcon }} />
                </Box>
            }
            icon={
                <Box
                    sx={{
                        ...checkboxSx,
                        border: `1px solid ${theme.palette.primary.main}`,
                        ...sxEmpty,
                    }}
                />
            }
            sx={{ borderRadius: '4px', color: theme.palette.primary.main }}
        />
    );
};

export { MeltaCheckbox };
