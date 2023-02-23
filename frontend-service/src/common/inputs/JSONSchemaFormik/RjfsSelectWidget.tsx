/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import { WidgetProps, utils } from '@rjsf/core';
import i18next from 'i18next';
import { useMuiComponent } from './rjsfUseMuiComponent';
import { MiniFilter } from '../../SelectCheckbox'

const { asNumber, guessType } = utils;

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
// https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/material-ui/src/SelectWidget/SelectWidget.tsx
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
    placeholder,
    rawErrors = [],
}: WidgetProps) => {
    const { TextField, MenuItem } = useMuiComponent();
    const { enumOptions, enumDisabled } = options;
    const [miniFilterValue, setMiniFilterValue] = useState('');

    const emptyValue = multiple ? [] : '';

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
        onChange(processValue(schema, newValue));
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, processValue(schema, newValue));
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, processValue(schema, newValue));

    return (
        <TextField
            id={id}
            label={label || schema.title}
            select
            value={typeof value === 'undefined' ? emptyValue : value}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            error={rawErrors.length > 0}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            InputLabelProps={{
                shrink: true,
            }}
            SelectProps={{
                multiple: typeof multiple === 'undefined' ? false : multiple,
            }}
        >
            <MenuItem value="">{placeholder || i18next.t('wizard.entity.enumEmptyOption')}
            </MenuItem>
            <MenuItem><MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} /></MenuItem>
            {(enumOptions as any).filter(
                ({label: currLabel }: any) =>
                    (miniFilterValue === '' || currLabel.includes(miniFilterValue)),
            ).map(({ value: currValue, label: currLabel }: any, i: number) => {
                const isDisabled: any = enumDisabled && (enumDisabled as any).indexOf(currValue) !== -1;
                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <MenuItem key={i} value={currValue} disabled={isDisabled}>
                        {currLabel}
                    </MenuItem>
                );
            })}
        </TextField>
    );
};

export default RjfsSelectWidget;
