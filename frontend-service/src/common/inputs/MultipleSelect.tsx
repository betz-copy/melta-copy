import { Autocomplete, MenuItem, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import { ExpandMore, Close } from '@mui/icons-material';
import { ColoredEnumChip } from '../ColoredEnumChip';
import { MeltaCheckbox } from '../MeltaCheckbox';

const MultipleSelect: React.FC<{
    items: {
        label: string;
        value: string;
        color?: string;
    }[];
    id: string;
    disabled?: boolean;
    readonly?: boolean;
    multiple?: boolean;
    selectedValue:
        | {
              label: string;
              value: string;
              color?: string;
          }
        | {
              label: string;
              value: string;
              color?: string;
          }[]
        | null;
    onChange: (event, newVal) => void;
    textFieldProps: any;
    required?: boolean;
    autofocus?: boolean;
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
    variant: 'standard' | 'outlined';
    rawErrors: string[];
    label?: string;
    color?: string;
    value: any;
}> = ({
    items,
    id,
    disabled,
    readonly,
    multiple,
    selectedValue,
    onChange,
    textFieldProps,
    required,
    autofocus,
    onBlur,
    onFocus,
    variant,
    rawErrors,
    label,
    color,
    value,
}) => {
    return (
        <Autocomplete<(typeof items)[number], boolean>
            id={id}
            disabled={disabled}
            readOnly={readonly}
            multiple={multiple}
            disableCloseOnSelect={multiple}
            value={selectedValue}
            options={items}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            onChange={onChange}
            popupIcon={<ExpandMore />}
            renderOption={(props, option) => {
                return (
                    <MenuItem {...props} key={option.value} value={option.value} style={{ height: '40px' }}>
                        {multiple && <MeltaCheckbox checked={value.includes(option.value)} />}
                        <ColoredEnumChip {...props} label={option.label} color={option.color || 'default'} />
                    </MenuItem>
                );
            }}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const { key, onDelete, ...restTagProps } = getTagProps({ index });
                    return (
                        <ColoredEnumChip
                            key={key}
                            label={option.label}
                            color={option.color || 'default'}
                            onDelete={onDelete}
                            deleteIcon={<Close />}
                            {...restTagProps}
                            style={{
                                margin: '0 4px 4px 0',
                            }}
                        />
                    );
                })
            }
            renderInput={(params) => (
                <TextField
                    {...textFieldProps}
                    {...params}
                    required={required}
                    autoFocus={autofocus}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    variant={variant}
                    error={rawErrors.length > 0}
                    label={label}
                    InputLabelProps={{
                        shrink: readonly || undefined,
                    }}
                    inputProps={{
                        required: multiple ? required && value.length === 0 : required,
                        ...params.inputProps,
                    }}
                    color={color as TextFieldProps['color']}
                />
            )}
        />
    );
};

export default MultipleSelect;
