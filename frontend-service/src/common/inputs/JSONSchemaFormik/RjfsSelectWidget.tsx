/* eslint-disable no-underscore-dangle */
import React from 'react';
import { WidgetProps, asNumber, guessType } from '@rjsf/utils';
import { Autocomplete, TextField, TextFieldProps } from '@mui/material';
import sortBy from 'lodash.sortby';

const nums = new Set(['number', 'integer']);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any) => {
    // "enum" is a reserved word, so only "type" and "items" can be destructured
    const { type, items } = schema;
    if (value === '') {
        return undefined;
    }
    if (type === 'array' && items && nums.has(items.type)) {
        return value.map(asNumber);
    }
    if (type === 'boolean') {
        return value === 'true';
    }
    if (type === 'number') {
        return asNumber(value);
    }

    // If type is undefined, but an enum is present, try and infer the type from
    // the enum values
    if (schema.enum) {
        if (schema.enum.every((x: any) => guessType(x) === 'number')) {
            return asNumber(value);
        }
        if (schema.enum.every((x: any) => guessType(x) === 'boolean')) {
            return value === 'true';
        }
    }

    return value;
};

// copied from @rjs/material-ui SelectWidget (added empty option)
// https://github.com/rjsf-team/react-jsonschema-form/blob/v4.0.1/packages/material-ui/src/SelectWidget/SelectWidget.tsx
const RjfsSelectWidget = ({
    schema,
    id,
    options,
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
    ...textFieldProps
}: WidgetProps) => {
    const { enumOptions } = options;

    const emptyValue = multiple ? [] : '';
    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
        onChange(processValue(schema, newValue));
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, processValue(schema, newValue));
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, processValue(schema, newValue));
    const variant = readonly ? 'standard' : 'outlined';

    return (
        <Autocomplete
            id={id}
            disabled={disabled}
            readOnly={readonly}
            multiple={multiple}
            // eslint-disable-next-line no-nested-ternary
            value={typeof value === 'undefined' ? (multiple ? [] : emptyValue) : value}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            onChange={(event, newValue) => {
                if (multiple) {
                    // Filter out duplicate values
                    const uniqueValues = newValue.reduce((unique, item) => {
                        const isDuplicate = unique.some(
                            (uItem) => (typeof uItem === 'string' ? uItem : uItem.value) === (typeof item === 'string' ? item : item.value),
                        );
                        if (!isDuplicate) {
                            unique.push(item);
                        }
                        return unique;
                    }, []);

                    // Map and process values
                    const updatedValue = uniqueValues.map((item) => (typeof item === 'string' ? { label: item, value: item } : item));
                    const processedValue = updatedValue.map((option) => processValue(schema, option.value));

                    onChange(processedValue);
                } else {
                    // Single selection logic remains unchanged
                    const processedValue = processValue(schema, newValue ? newValue.value : '');
                    onChange(processedValue);
                }
                event.preventDefault();
            }}
            renderInput={(params) => (
                <TextField
                    {...textFieldProps}
                    {...params}
                    required={required}
                    autoFocus={autofocus}
                    onChange={_onChange}
                    onBlur={_onBlur}
                    onFocus={_onFocus}
                    variant={variant}
                    InputLabelProps={{
                        shrink: readonly || undefined,
                    }}
                    error={rawErrors.length > 0}
                    color={color as TextFieldProps['color']}
                    label={label || schema.title}
                />
            )}
            renderOption={(props, option) => {
                return (
                    <span {...props} style={{ backgroundColor: option.value === value ? 'Gainsboro' : 'white' }}>
                        {option.value}
                    </span>
                );
            }}
            options={sortBy(enumOptions!, (o) => o.value)}
            getOptionDisabled={(option) => Boolean(value?.includes(option.value))}
        />
    );
};

export default RjfsSelectWidget;
