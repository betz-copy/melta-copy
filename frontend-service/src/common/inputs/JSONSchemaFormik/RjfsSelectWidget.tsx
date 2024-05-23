/* eslint-disable no-underscore-dangle */
import React from 'react';
import { WidgetProps, asNumber, guessType } from '@rjsf/utils';
import { Autocomplete, TextField, TextFieldProps } from '@mui/material';
import './form.css';

const nums = new Set(['number', 'integer']);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any) => {
    // "enum" is a reserved word, so only "type" and "items" can be destructured
    const { type, items } = schema;
    if (value === null) {
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

    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, processValue(schema, newValue));
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, processValue(schema, newValue));
    const variant = readonly ? 'standard' : 'outlined';

    return (
        <Autocomplete<string | string[], boolean>
            id={id}
            disabled={disabled}
            readOnly={readonly}
            multiple={multiple}
            // eslint-disable-next-line no-nested-ternary
            value={typeof value === 'undefined' ? null : value}
            isOptionEqualToValue={(option, val) => option === val}
            onChange={(event, newValue) => {
                if (multiple) {
                    const processedValue = (newValue as string[]).map((option) => processValue(schema, option));
                    onChange(newValue!.length !== 0 ? processedValue : undefined);
                } else {
                    const processedValue = processValue(schema, newValue);
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
                    onBlur={_onBlur}
                    onFocus={_onFocus}
                    variant={variant}
                    InputLabelProps={{
                        shrink: readonly || undefined,
                    }}
                    inputProps={{
                        ...params.inputProps,
                        required: multiple ? required && value.length === 0 : required,
                        style: {
                            ...params.inputProps,
                            textOverflow: 'ellipsis',
                        },
                    }}
                    error={rawErrors.length > 0}
                    color={color as TextFieldProps['color']}
                    label={label || schema.title}
                />
            )}
            renderOption={(props, option) => {
                return (
                    <span {...props} style={{ backgroundColor: option === value ? 'Gainsboro' : 'white' }}>
                        {option}
                    </span>
                );
            }}
            options={enumOptions!.map((o) => o.value).sort()}
            getOptionDisabled={(option) => (multiple ? Boolean(value?.includes(option)) : false)}
        />
    );
};

export default RjfsSelectWidget;
