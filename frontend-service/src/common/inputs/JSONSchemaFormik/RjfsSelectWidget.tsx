/* eslint-disable no-underscore-dangle */
import React from 'react';
import { WidgetProps, asNumber, getUiOptions, guessType } from '@rjsf/utils';
import { Autocomplete, TextField, TextFieldProps } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './form.css';
import { ColoredEnumChip } from '../../ColoredEnumChip';

const nums = new Set(['number', 'integer']);

function processValue(schema: any, value: any) {
    const { type, items } = schema;
    if (value === null) return undefined;
    if (type === 'array' && items && nums.has(items.type)) {
        return value.map(asNumber);
    }
    if (type === 'boolean') {
        return value === 'true';
    }
    if (type === 'number') {
        return asNumber(value);
    }
    if (schema.enum) {
        if (schema.enum.every((x: any) => guessType(x) === 'number')) {
            return asNumber(value);
        }
        if (schema.enum.every((x: any) => guessType(x) === 'boolean')) {
            return value === 'true';
        }
    }
    return value;
}

const RjfsSelectWidget = ({
    schema,
    uiSchema,
    id,
    label,
    required,
    disabled,
    readonly,
    value,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    color,
    formContext,
    ...textFieldProps
}: WidgetProps) => {
    const { enumOptions: items } = getUiOptions(uiSchema) as {
        enumOptions: Array<{
            label: string;
            value: string;
            color?: string;
        }>;
    };

    let selectedValue: (typeof items)[number] | (typeof items)[number][] | null;
    if (multiple) {
        if (Array.isArray(value)) {
            selectedValue = items.filter((opt) => value.includes(opt.value));
        } else {
            selectedValue = [];
        }
    } else {
        selectedValue = items.find((opt) => opt.value === value) || null;
    }

    const _onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        const newValue = processValue(schema, event.target.value);
        onBlur(id, newValue);
    };

    const _onFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        const newValue = processValue(schema, event.target.value);
        onFocus(id, newValue);
    };

    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';

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
            onChange={(event, newVal) => {
                event.preventDefault();
                if (multiple) {
                    const mapped = (newVal as (typeof items)[number][]).map((opt) => processValue(schema, opt.value));
                    onChange(mapped.length ? mapped : undefined);
                } else {
                    const val = (newVal as (typeof items)[number] | null)?.value;
                    onChange(val ? processValue(schema, val) : undefined);
                }
            }}
            renderOption={(props, option) =>
                option.color ? (
                    <li {...props} key={option.value}>
                        <ColoredEnumChip label={option.label} color={option.color || 'default'} />
                    </li>
                ) : (
                    <span {...props}>{option.label}</span>
                )
            }
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const { key, onDelete, ...restTagProps } = getTagProps({ index });
                    return (
                        <ColoredEnumChip
                            key={key}
                            label={option.label}
                            color={option.color || 'default'}
                            onDelete={onDelete}
                            deleteIcon={<CloseIcon />}
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
                    onBlur={_onBlur}
                    onFocus={_onFocus}
                    variant={variant}
                    error={rawErrors.length > 0}
                    label={label || schema.title}
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

export default RjfsSelectWidget;
