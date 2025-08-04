import { Close, ExpandMore } from '@mui/icons-material';
import { Autocomplete, MenuItem, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import OverflowWrapper from '../../utils/agGrid/OverflowWrapper';
import { ColoredEnumChip } from '../ColoredEnumChip';
import MeltaCheckbox from '../MeltaDesigns/MeltaCheckbox';

export interface ISelectOption {
    label: string;
    value: string;
    color?: string;
}

const MultipleSelect: React.FC<{
    id: string;
    items: ISelectOption[];
    selectedValue: ISelectOption | ISelectOption[] | null;
    onChange: (event: React.SyntheticEvent, newVal: ISelectOption | ISelectOption[] | null) => void;
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
    variant: 'standard' | 'outlined';
    rawErrors: string[];
    textFieldProps: any;
    value?: any;
    multiple?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    autofocus?: boolean;
    label?: string;
    color?: string;
    placeholder?: string;
}> = ({
    id,
    items,
    selectedValue,
    onChange,
    onBlur,
    onFocus,
    variant,
    rawErrors,
    textFieldProps,
    value,
    multiple,
    disabled,
    readonly,
    autofocus,
    label,
    color,
    placeholder,
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
            placeholder={placeholder}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            onChange={onChange}
            popupIcon={<ExpandMore />}
            renderOption={(props, option) => {
                return (
                    <MenuItem {...props} key={option.value} value={option.value} style={{ height: '40px' }}>
                        {!!value && multiple && <MeltaCheckbox checked={value?.includes(option.value)} />}
                        <ColoredEnumChip {...props} label={option.label} color={option.color || 'default'} />
                    </MenuItem>
                );
            }}
            renderTags={(tagValue, getTagProps) => (
                <OverflowWrapper
                    items={tagValue}
                    propertyToDisplayInTooltip="label"
                    getItemKey={(item) => item.value}
                    renderItem={(item, index) => {
                        const { key, onDelete, ...restTagProps } = getTagProps({ index });

                        return (
                            <ColoredEnumChip
                                label={item.label}
                                color={item.color || 'default'}
                                onDelete={onDelete}
                                deleteIcon={<Close />}
                                {...restTagProps}
                                style={{ margin: '2px 4px 2px 0' }}
                            />
                        );
                    }}
                />
            )}
            renderInput={(params) => {
                const isMultiple = selectedValue && !Array.isArray(selectedValue);
                return (
                    <TextField
                        {...textFieldProps}
                        {...params}
                        autoFocus={autofocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        variant={variant}
                        error={rawErrors.length > 0}
                        label={label}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: isMultiple ? (
                                <ColoredEnumChip label={selectedValue.label} color={selectedValue.color || 'default'} style={{ marginLeft: 1 }} />
                            ) : (
                                params.InputProps.startAdornment
                            ),
                            inputProps: {
                                ...params.inputProps,
                                style: isMultiple ? { display: 'none' } : {},
                            },
                        }}
                        color={color as TextFieldProps['color']}
                        InputLabelProps={{ shrink: readonly || undefined }}
                    />
                );
            }}
        />
    );
};

export default MultipleSelect;
