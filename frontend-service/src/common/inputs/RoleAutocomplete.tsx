import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IRole } from '../../interfaces/roles';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';

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
    size?: 'small' | 'medium';
    enableClear?: boolean;
    required?: boolean;
    autoFocus?: any;
    textFieldProps?: any;
    overrideSx?: Object;
}

const RoleAutocomplete: React.FC<IRoleAutocomplete> = ({
    value,
    options = [],
    refetch,
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
    return (
        <MeltaTooltip title={value?.name ?? ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value ?? null}
                onChange={(_e, newValue, reason) => {
                    onChange?.(_e, reason === 'clear' ? null : newValue, reason);
                    if (reason === 'clear') onDisplayValueChange?.(_e, '', reason);
                }}
                onInputChange={(_e, newValue, reason) => {
                    onDisplayValueChange?.(_e, newValue, reason);
                    if (reason === 'input' && newValue.length >= 1) refetch();
                }}
                disabled={disabled}
                getOptionLabel={(option) => option.name}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currentValue) => option._id === currentValue?._id}
                options={options}
                loading={!options.length}
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
                            endAdornment: enableClear ? params.InputProps.endAdornment : undefined,
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

export default RoleAutocomplete;
