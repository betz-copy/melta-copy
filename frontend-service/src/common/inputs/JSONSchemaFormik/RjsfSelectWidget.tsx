/* eslint-disable no-underscore-dangle */
import { WidgetProps, asNumber, getUiOptions, guessType } from '@rjsf/utils';
import React from 'react';
import MultipleSelect from '../MultipleSelect';
import './form.css';

const nums = new Set(['number', 'integer']);

const processValue = (schema: any, value: any) => {
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
};

const RjsfSelectWidget = ({
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
    options,
    hideError,
    hideLabel,
    formContext,
    ...textFieldProps
}: WidgetProps) => {
    const { defaultValue } = options;
    const { enumOptions: items = [] } =
        (getUiOptions(uiSchema) as {
            enumOptions?: Array<{
                label: string;
                value: string;
                color?: string;
            }>;
        }) || {};

    let selectedValue: (typeof items)[number] | (typeof items)[number][] | null;
    if (multiple) {
        if (Array.isArray(value) && items) {
            selectedValue = items.filter((opt) => value.includes(opt.value));
        } else {
            selectedValue = [];
        }
    } else {
        selectedValue = items ? items.find((opt) => opt.value === value) || null : null;
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
        <MultipleSelect
            items={items}
            id={id}
            schema={schema}
            disabled={disabled}
            readonly={readonly}
            multiple={multiple}
            selectedValue={selectedValue}
            onChange={(event, newVal) => {
                event.preventDefault();
                if (multiple) {
                    const mapped = (newVal as (typeof items)[number][]).map((opt) => processValue(schema, opt.value));
                    onChange(mapped.length ? mapped : defaultValue);
                } else {
                    const val = (newVal as (typeof items)[number] | null)?.value;
                    onChange(val ? processValue(schema, val) : defaultValue);
                }
            }}
            textFieldProps={textFieldProps}
            required={required}
            autofocus={autofocus}
            onBlur={_onBlur}
            onFocus={_onFocus}
            variant={variant}
            rawErrors={!hideError ? rawErrors : []}
            label={!hideLabel ? label || schema.title : undefined}
            color={color}
            value={value}
            placeholder={Array.isArray(defaultValue) ? defaultValue.join(', ') : (defaultValue as string | undefined)}
        />
    );
};

export default RjsfSelectWidget;
