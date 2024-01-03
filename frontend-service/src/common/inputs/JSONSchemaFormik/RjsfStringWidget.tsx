/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { TextField, TextFieldProps } from '@mui/material';

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
    color,
    ...textFieldProps
}: WidgetProps) => {
    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
        onChange(newValue === '' ? options.emptyValue : newValue);
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);
    const variant = readonly ? 'standard' : 'outlined';

    const { rootSchema } = registry;
    const displayLabel = getDisplayLabel(validator, schema, uiSchema, rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const isLTR = schema.serialCurrent === undefined ? schema.type === 'number' || Boolean(schema.pattern) : false;

    return (
        <TextField
            {...textFieldProps}
            color="primary"
            style={{
                maxWidth: '250px',
            }}
            variant={variant}
            id={id}
            placeholder={placeholder}
            label={displayLabel ? label || schema.title : false}
            autoFocus={autofocus}
            required={required}
            disabled={disabled}
            inputProps={{
                readOnly: readonly,
            }}
            InputLabelProps={{
                shrink: readonly || undefined,
            }}
            type={(options.inputType ?? inputType) as string}
            value={options.hardCodedValue ?? value ?? ''}
            error={rawErrors.length > 0}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            onWheel={(e) => {
                if (inputType === 'number') (e.target as HTMLElement).blur(); // disable number input scroll to change value when focused, but blurring it
            }}
            dir={isLTR ? 'ltr' : 'rtl'}
        />
    );
};

export default RjsfTextWidget;
