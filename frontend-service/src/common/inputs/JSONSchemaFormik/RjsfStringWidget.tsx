/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { TextField } from '@mui/material';
import { convertToPlainText, containsHTMLTags } from '../../../utils/HtmlTagsStringValue';
import { getFixedNumber, getTextDirection } from '../../../utils/stringValues';

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
    _formContext,
    registry,
    _color,
    _propertyReadOnly,
    ...textFieldProps
}: WidgetProps) => {
    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const parsedValue = (type || schema.type) === 'number' && newValue !== '' ? Number(newValue) : newValue;
        onChange(newValue === '' ? options.emptyValue : parsedValue);
    };
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);
    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';
    const { rootSchema } = registry;
    const displayLabel = getDisplayLabel(validator, schema, uiSchema, rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const isTextArea = containsHTMLTags(value);
    let finalValue;

    if (options.hardCodedValue) finalValue = options.hardCodedValue;
    else if (isTextArea) finalValue = convertToPlainText(value);
    else if (schema.type === 'number' && value) finalValue = getFixedNumber(Number(value));
    else finalValue = value ?? '';

    return (
        <TextField
            {...textFieldProps}
            color="primary"
            variant={variant}
            fullWidth
            id={id}
            placeholder={placeholder}
            label={displayLabel ? label || schema.title : false}
            autoFocus={autofocus}
            required={required}
            disabled={disabled}
            InputLabelProps={{
                shrink: readonly || undefined,
                style: {
                    fontSize: '14px',
                },
            }}
            inputProps={{
                readOnly: readonly,
                style: {
                    textOverflow: 'ellipsis',
                    fontSize: '14px',
                },
            }}
            type={(options.inputType ?? inputType) as string}
            value={finalValue}
            error={rawErrors.length > 0}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            onWheel={(e) => {
                if (inputType === 'number') (e.target as HTMLElement).blur(); // disable number input scroll to change value when focused, but blurring it
            }}
            dir={getTextDirection(value, schema)}
        />
    );
};

export default RjsfTextWidget;
