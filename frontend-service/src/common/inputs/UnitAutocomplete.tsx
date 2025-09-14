import { Autocomplete, AutocompleteProps, Chip, TextField } from '@mui/material';
import { Clear } from '@mui/icons-material';
import i18next from 'i18next';
import React from 'react';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import { useDarkModeStore } from '../../stores/darkMode';

export interface IUnitAutocomplete {
    value?: string[];
    options?: string[];
    isLoading: boolean;
    onChange: AutocompleteProps<string, true, false, false>['onChange'];
    onBlur?: (event: React.FocusEvent) => void;
    onFocus?: (event: React.FocusEvent) => void;
    isOptionDisabled?: AutocompleteProps<string, true, false, false>['getOptionDisabled'];
    disabled?: boolean;
    readOnly?: boolean;
    label?: string;
    isError: boolean;
    helperText?: string;
    size?: 'small' | 'medium';
    enableClear?: boolean;
    required?: boolean;
    autoFocus?: any;
    textFieldProps?: any;
    overrideSx?: Object;
}

const UnitAutocomplete: React.FC<IUnitAutocomplete> = ({
    value = [],
    options = [],
    isLoading,
    onChange,
    onBlur,
    onFocus,
    isOptionDisabled,
    disabled = false,
    readOnly = false,
    label = i18next.t('unitAutocomplete.label'),
    isError,
    helperText,
    size,
    enableClear = false,
    required,
    autoFocus,
    textFieldProps,
    overrideSx,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <MeltaTooltip title={value?.join(', ') ?? ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                multiple
                value={value}
                onChange={(_e, newValue, reason) => {
                    const uniqueValues = Array.from(new Set(newValue.map((val) => val.trim())));
                    onChange?.(_e, reason === 'clear' ? [] : uniqueValues, reason);
                }}
                disabled={disabled}
                getOptionLabel={(option) => option}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currentValue) => option === currentValue}
                options={options}
                loading={isLoading}
                loadingText={i18next.t('unitAutocomplete.loading')}
                noOptionsText={i18next.t('unitAutocomplete.noOptions')}
                renderValue={(selected, getTagProps) =>
                    selected.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option}
                            label={option}
                            deleteIcon={<Clear sx={{ color: darkMode ? '#EBEFFA' : '#9398C2', fontSize: 16 }} />}
                            sx={{
                                fontFamily: 'Rubik, sans-serif',
                                fontWeight: 400,
                                fontSize: '14px',
                                borderRadius: '10px',
                                padding: '12px 4px',
                                backgroundColor: darkMode ? '#53566E' : '#EBEFFA',
                                color: darkMode ? '#EBEFFA' : '#53566E',
                                '& .MuiChip-deleteIcon': {
                                    color: darkMode ? '#EBEFFA' : '#9398C2',
                                },
                                height: '22px',
                                minWidth: '74px',
                            }}
                            variant="outlined"
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        {...textFieldProps}
                        autoFocus={autoFocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        error={isError}
                        fullWidth
                        helperText={helperText}
                        label={label}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                required,
                                readOnly,
                                endAdornment: enableClear ? params.InputProps.endAdornment : undefined,
                            },
                        }}
                        sx={overrideSx}
                    />
                )}
                readOnly={readOnly}
                size={size}
            />
        </MeltaTooltip>
    );
};

export default UnitAutocomplete;
