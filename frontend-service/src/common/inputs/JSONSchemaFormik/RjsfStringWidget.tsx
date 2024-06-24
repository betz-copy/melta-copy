/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { getDisplayLabel, WidgetProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { TextField } from '@mui/material';
import { convertToPlainText, containsHTMLTags } from '../../../utils/HtmlTagsStringValue';

export const isStartWithHebrewLetter = (value: string) => {
    const uniqueCharsPattern = /^[^a-zA-Z\u0590-\u05FF]+/g;
    const cleanedStr = value.replace(uniqueCharsPattern, '');
    const isHebrewLetter = /^[\u0590-\u05FF]/.test(cleanedStr.charAt(0));

    return isHebrewLetter;
};

export const getTextDirection = (value: string, schema: RJSFSchema): string => {
    if (schema.type === 'string' && value) {
        return isStartWithHebrewLetter(value) ? 'rtl' : 'ltr';
    }

    if (schema.serialCurrent === undefined) {
        return schema.type === 'number' || Boolean(schema.pattern) ? 'ltr' : 'rtl';
    }
    return 'ltr';
};
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

    const isTextArea = containsHTMLTags(value);
    let finalValue;

    if (options.hardCodedValue) finalValue = options.hardCodedValue;
    else if (isTextArea) finalValue = convertToPlainText(value);
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
            }}
            inputProps={{
                readOnly: readonly,
                style: {
                    textOverflow: 'ellipsis',
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
