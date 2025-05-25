import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import React, { useMemo, useState } from 'react';
import { MeltaTooltip } from '../MeltaTooltip';
import { IRole } from '../../interfaces/roles';

export interface IRoleAutocomplete {
    value?: IRole;
    options?: IRole[];
    refetch: any;
    displayValue?: string;
    onChange: AutocompleteProps<IRole, undefined, undefined, undefined>['onChange'];
    onDisplayValueChange?: AutocompleteProps<IRole, undefined, undefined, undefined>['onInputChange'];
    onBlur?: any;
    onFocus?: any;
    isOptionDisabled?: AutocompleteProps<IRole, undefined, undefined, undefined>['getOptionDisabled'];
    disabled?: boolean;
    readOnly?: boolean;
    label?: string;
    isError: boolean;
    helperText?: string;
    minInputLengthToSearch?: number;
    size?: 'small' | 'medium';
    enableClear?: boolean;
    required?: boolean;
    autoFocus?: any;
    textFieldProps?: any;
    overrideSx?: Object;
}

const RoleAutocomplete: React.FC<IRoleAutocomplete> = ({
    value,
    options,
    refetch,
    displayValue,
    onChange,
    onDisplayValueChange,
    onBlur,
    onFocus,
    isOptionDisabled,
    disabled = false,
    readOnly = false,
    label = i18next.t('roleAutocomplete.label'),
    isError,
    helperText,
    size,
    enableClear = false,
    required,
    autoFocus,
    textFieldProps,
    overrideSx,
}) => {
    const [inputValue, setInputValue] = useState(value?.name ?? '');
    const currentDisplayValue = displayValue ?? inputValue;

    const filteredRoles = useMemo(() => {
        if (!options) return [];
        const searchTerm = inputValue.toLowerCase();
        return options.filter((role) => role.name.toLowerCase().includes(searchTerm));
    }, [options, inputValue]);

    return (
        <MeltaTooltip title={value?.name ?? ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value}
                inputValue={currentDisplayValue}
                onChange={(_e, newValue, reason) => {
                    onChange?.(_e, reason === 'clear' ? null : newValue, reason);
                    if (reason === 'clear') onDisplayValueChange?.(_e, '', reason);
                }}
                onInputChange={(_e, newValue, reason) => {
                    setInputValue(reason === 'clear' ? '' : newValue);
                    onDisplayValueChange?.(_e, reason === 'clear' ? '' : newValue, reason);
                    if (reason === 'input') refetch();
                }}
                disabled={disabled}
                filterOptions={(options) => options}
                getOptionLabel={({ name }) => name}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currentValue) => option._id === currentValue?._id}
                options={filteredRoles}
                loading={!options}
                loadingText={i18next.t('roleAutocomplete.loading')}
                noOptionsText={i18next.t('roleAutocomplete.noOptions')}
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
                        InputProps={{
                            ...params.InputProps,
                            required,
                            readOnly,
                            endAdornment: enableClear ? params.InputProps.endAdornment : (readOnly || disabled) && undefined,
                        }}
                        InputLabelProps={{
                            ...(params.InputLabelProps,
                            readOnly && {
                                sx: {
                                    '&.Mui-focused': {
                                        color: 'rgba(0, 0, 0, 0.6)',
                                    },
                                },
                            }),
                        }}
                        sx={{
                            ...(readOnly
                                ? {
                                      '& .MuiOutlinedInput-root.Mui-focused': {
                                          '& > fieldset': {
                                              borderColor: 'rgba(0, 0, 0, 0.23)',
                                              borderWidth: '1px',
                                          },
                                      },
                                      '& .MuiOutlinedInput-root:hover': {
                                          '& > fieldset': {
                                              borderColor: 'rgba(0, 0, 0, 0.23)',
                                              borderWidth: '1px',
                                          },
                                      },
                                  }
                                : {}),
                            ...overrideSx,
                        }}
                    />
                )}
                readOnly={readOnly}
                size={size}
            />
        </MeltaTooltip>
    );
};

export default RoleAutocomplete;
