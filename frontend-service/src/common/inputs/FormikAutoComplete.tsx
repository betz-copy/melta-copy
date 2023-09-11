import React, { CSSProperties } from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { FormikProps, getIn } from 'formik';

interface IFormikAutoCompleteProps<T> {
    formik: FormikProps<any>;
    formikField: string;
    options: T[];
    label: string;
    disabled?: boolean;
    multiple?: boolean;
    hideSelectedOptions?: boolean;
    getOptionLabel?: (option: T) => string;
    getOptionDisabled?: (option: T) => boolean;
    onChange?: (value: T | T[] | null) => void;
    style?: CSSProperties;
}

export const FormikAutoComplete = <T,>({
    formik: { values, setFieldValue, touched, errors },
    formikField,
    options,
    label,
    disabled,
    multiple,
    hideSelectedOptions,
    getOptionLabel,
    getOptionDisabled,
    onChange,
    style
}: IFormikAutoCompleteProps<T>) => {
    const error = getIn(touched, formikField) && getIn(errors, formikField);

    return (
        <Autocomplete
            fullWidth
            options={options}
            value={getIn(values, formikField)}
            onChange={(_, newValue) => onChange ? onChange(newValue) : setFieldValue(formikField, newValue)}
            getOptionLabel={getOptionLabel}
            getOptionDisabled={getOptionDisabled}
            disabled={disabled}
            multiple={multiple}
            filterSelectedOptions={hideSelectedOptions}
            renderInput={(params) => (
                <TextField
                    {...params}
                    id={formikField}
                    name={formikField}
                    error={Boolean(error)}
                    helperText={error}
                    label={label}
                    sx={style}
                />
            )}
            renderTags={(tags, getTagProps) =>
                tags.map((option, index) => (
                    <Chip
                        {...getTagProps({ index })}
                        variant="outlined"
                        label={getOptionLabel ? getOptionLabel(option) : option}
                    />
                ))
            }
        />
    );
};
