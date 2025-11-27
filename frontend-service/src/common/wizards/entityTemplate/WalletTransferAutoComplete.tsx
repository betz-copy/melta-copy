import { Autocomplete, TextField } from '@mui/material';
import { getIn } from 'formik';
import React from 'react';

interface WalletAutocompleteProps<T> {
    label: string;
    options: T[];
    value: T | null;
    disabled?: boolean;
    touched: any;
    errors: any;
    fieldPath: string;
    onChange: (value: T | null) => void;
    darkMode: boolean;
}

export function WalletTransferAutocomplete<T extends { title: string }>({
    label,
    options,
    value,
    disabled,
    touched,
    errors,
    fieldPath,
    onChange,
    darkMode,
}: WalletAutocompleteProps<T>) {
    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={(_e, val) => onChange(val)}
            getOptionLabel={(option) => option.title}
            onBlur={() => {}}
            disabled={disabled}
            sx={{
                width: 250,
                ...(!darkMode && {
                    '& .MuiInputBase-root.Mui-disabled': {
                        backgroundColor: '#F3F5F9',
                    },
                    '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#BBBED8',
                    },
                }),
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    label={label}
                    error={Boolean(getIn(touched, fieldPath) && getIn(errors, fieldPath))}
                    helperText={getIn(touched, fieldPath) ? getIn(errors, fieldPath) : ''}
                />
            )}
        />
    );
}
