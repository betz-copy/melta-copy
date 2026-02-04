import { Check, Remove } from '@mui/icons-material';
import { Box, Checkbox, SxProps, useTheme } from '@mui/material';
import React, { CSSProperties, useMemo } from 'react';
import { useDarkModeStore } from '../../stores/darkMode';

interface MeltaCheckboxProps {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    sxChecked?: SxProps;
    sxIndeterminate?: SxProps;
    sxEmpty?: SxProps;
    sxIcon?: CSSProperties;
    sx?: SxProps;
    checkboxSx?: SxProps;
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
    sx,
    checkboxSx,
}) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const checkBoxColor = useMemo(() => (darkMode ? theme.palette.primary.main : '#4752B6'), [darkMode, theme.palette.primary.main]);

    const defaultCheckboxSx: SxProps = {
        borderRadius: '4px',
        width: '20px',
        height: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };
    const mergedCheckboxSx = { ...defaultCheckboxSx, ...checkboxSx };

    return (
        <Checkbox
            checked={Boolean(checked)}
            indeterminate={Boolean(indeterminate)}
            disabled={Boolean(disabled)}
            onChange={onChange}
            checkedIcon={
                <Box
                    sx={{
                        ...mergedCheckboxSx,
                        background: checkBoxColor,
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
                        ...mergedCheckboxSx,
                        background: checkBoxColor,
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
                        ...mergedCheckboxSx,
                        border: `1px solid ${disabled ? 'grey' : checkBoxColor}`,
                        ...sxEmpty,
                    }}
                />
            }
            sx={{
                ...sx,
                borderRadius: '4px',
                color: checkBoxColor,
            }}
        />
    );
};

export default MeltaCheckbox;
