import { Autocomplete, Chip, TextField } from '@mui/material';
import { FormikProps, getIn } from 'formik';
import { CSSProperties } from 'react';
import { IoIosArrowDown } from 'react-icons/io';

interface IFormikAutoCompleteProps<T> {
    formik: FormikProps<any>;
    formikField: string;
    options: T[];
    label: string;
    disabled?: boolean;
    multiple?: boolean;
    hideSelectedOptions?: boolean;
    disableClear?: boolean;
    getOptionLabel?: (option: T) => string;
    getOptionDisabled?: (option: T) => boolean;
    onChange?: (value: T | T[] | null) => void;
    style?: CSSProperties;
    readonly?: boolean;
}

export const FormikAutoComplete = <T,>({
    formik: { values, setFieldValue, touched, errors },
    formikField,
    options,
    label,
    disabled,
    multiple,
    hideSelectedOptions,
    disableClear,
    getOptionLabel,
    getOptionDisabled,
    onChange,
    style,
    readonly = false,
}: IFormikAutoCompleteProps<T>) => {
    const error = Boolean(getIn(touched, formikField)) && getIn(errors, formikField);

    return (
        <Autocomplete
            fullWidth
            options={options}
            value={getIn(values, formikField)}
            onChange={(_, newValue) => (onChange ? onChange(newValue) : setFieldValue(formikField, newValue))}
            getOptionLabel={getOptionLabel}
            getOptionDisabled={getOptionDisabled}
            disabled={disabled}
            multiple={multiple}
            filterSelectedOptions={hideSelectedOptions}
            disableClearable={disableClear}
            readOnly={readonly}
            renderInput={(params) => (
                <TextField
                    {...params}
                    id={formikField}
                    name={formikField}
                    error={Boolean(error)}
                    helperText={error}
                    label={label}
                    sx={style}
                    variant={readonly ? 'standard' : 'outlined'}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            endAdornment: !readonly && params.InputProps.endAdornment,
                            readOnly: readonly,
                            ...(readonly && { disableUnderline: true }),
                        },
                    }}
                />
            )}
            renderTags={(tags, getTagProps) =>
                tags.map((option, index) => (
                    <Chip
                        {...getTagProps({ index })}
                        key={getTagProps({ index }).key}
                        variant="outlined"
                        label={getOptionLabel ? getOptionLabel(option) : String(option)}
                    />
                ))
            }
            popupIcon={<IoIosArrowDown fontSize="Medium" />}
        />
    );
};
