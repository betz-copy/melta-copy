/* eslint-disable no-underscore-dangle */
import React from 'react';
import { WidgetProps, utils } from '@rjsf/core';
import { useMuiComponent } from './rjsfUseMuiComponent';

const { getDisplayLabel } = utils;

const RjsfTextWidget = ({
    id,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    rawErrors = [],
    formContext,
    registry,
    ...textFieldProps
}: WidgetProps) => {
    const { TextField } = useMuiComponent();
    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
        onChange(newValue === '' ? options.emptyValue : newValue);
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

    const { rootSchema } = registry;
    const displayLabel = getDisplayLabel(schema, uiSchema, rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const isLTR = schema.type === 'number' || Boolean(schema.pattern);

    return (
        <TextField
            id={id}
            placeholder={placeholder}
            label={displayLabel ? label || schema.title : false}
            autoFocus={autofocus}
            required={required}
            disabled={disabled || readonly}
            type={inputType as string}
            value={value || value === 0 ? value : ''}
            error={rawErrors.length > 0}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            dir={isLTR ? 'ltr' : 'rtl'}
            {...textFieldProps}
        />
    );
};

export default RjsfTextWidget;
