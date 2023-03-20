/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import { WidgetProps, asNumber, guessType } from '@rjsf/utils';
import i18next from 'i18next';
import { MiniFilter } from '../../SelectCheckbox'
import { Divider, MenuItem, TextField, TextFieldProps } from '@mui/material';

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
    formContext,
    uiSchema,
    color,
    ...textFieldProps
}: WidgetProps) => {
    const { enumOptions, enumDisabled } = options;
    const [miniFilterValue, setMiniFilterValue] = useState('');

    const emptyValue = multiple ? [] : '';

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
        onChange(processValue(schema, newValue));
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, processValue(schema, newValue));
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, processValue(schema, newValue));

    return (
        <TextField
            {...textFieldProps}
            color={color as TextFieldProps['color']}
            id={id}
            label={label || schema.title}
            value={typeof value === 'undefined' ? emptyValue : value}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            error={rawErrors.length > 0}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            select
            InputLabelProps={{
                shrink: true,
            }}
            SelectProps={{
                multiple: typeof multiple === 'undefined' ? false : multiple,
                sx: { maxHeight: '80vh' },
            }}
        >
            <MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} />

            {enumOptions?.filter(({ label: currLabel }) => (miniFilterValue === '' || currLabel.includes(miniFilterValue)))
                .map(({ value: currValue, label: currLabel }, index: number) => {
                    const isDisabled = enumDisabled && (enumDisabled).includes(currValue);
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <MenuItem key={index} value={currValue} disabled={isDisabled} onClick={(event) => {
                            onChange(processValue(schema, currValue));
                            event.preventDefault()
                        }}>
                            {currLabel}
                        </MenuItem>
                    );
                })}

            <Divider />
            <MenuItem value="">{placeholder || i18next.t('wizard.entity.enumEmptyOption')}</MenuItem>
        </TextField>
    );
};

export default RjfsSelectWidget;
