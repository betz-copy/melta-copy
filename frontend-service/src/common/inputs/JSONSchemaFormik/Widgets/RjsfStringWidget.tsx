import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { format, parseISO } from 'date-fns';
import React from 'react';
import { environment } from '../../../../globals';
import { containsHTMLTags, convertToPlainText } from '../../../../utils/HtmlTagsStringValue';
import { getFixedNumber, getTextDirection } from '../../../../utils/stringValues';

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
    propertyReadOnly,
    hideError,
    hideLabel,
    ...textFieldProps
}: WidgetProps) => {
    const { defaultValue } = options;
    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const parsedValue = (type || schema.type) === 'number' && newValue !== '' ? Number(newValue) : newValue;
        onChange(newValue === '' ? options.emptyValue : parsedValue);
    };
    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => {
        const isEmpty = newValue === '';
        if (isEmpty) onChange(defaultValue);
        onBlur(id, isEmpty ? defaultValue : newValue);
    };
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);
    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';
    const { rootSchema } = registry;
    const displayLabel = getDisplayLabel(validator, schema, uiSchema, rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const isTextArea = containsHTMLTags(value);
    let finalValue: any;

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

    if (options.hardCodedValue) finalValue = options.hardCodedValue;
    else if (isTextArea) finalValue = convertToPlainText(value);
    else if (schema.type === 'number' && value) finalValue = getFixedNumber(Number(value));
    else if (isoDateRegex.test(value)) {
        try {
            const parsedDate = parseISO(value);
            finalValue = format(parsedDate, environment.formats.dateTime);
        } catch {
            finalValue = value;
        }
    } else finalValue = value ?? '';

    const handleIncrement = () => {
        const newValue = Number(value || 0) + 1;
        onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Number(value || 0) - 1;
        onChange(newValue);
    };

    return (
        <TextField
            {...textFieldProps}
            color="primary"
            className={inputType === 'number' && schema.serialCurrent === undefined ? 'rjsf-text-input-override' : undefined}
            variant={variant}
            fullWidth
            id={id}
            placeholder={placeholder && !!placeholder?.length ? placeholder : String(defaultValue ?? '')}
            label={!hideLabel && (displayLabel ? label || schema.title : false)}
            autoFocus={autofocus}
            required={required}
            disabled={disabled}
            type={(options.inputType ?? inputType) as string}
            value={finalValue}
            error={!hideError && !!rawErrors.length}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            onWheel={(e) => {
                if (inputType === 'number') (e.target as HTMLElement).blur(); // disable number input scroll to change value when focused, but blurring it
            }}
            slotProps={{
                input: {
                    endAdornment:
                        inputType === 'number' && schema.serialCurrent === undefined ? (
                            <InputAdornment position="end">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <IconButton sx={{ padding: 0 }} size="small" onClick={handleIncrement} disabled={readonly || disabled}>
                                        <KeyboardArrowUp fontSize="small" color={value && !readonly ? 'action' : 'disabled'} />
                                    </IconButton>
                                    <IconButton sx={{ padding: 0 }} size="small" onClick={handleDecrement} disabled={readonly || disabled}>
                                        <KeyboardArrowDown fontSize="small" color={value && !readonly ? 'action' : 'disabled'} />
                                    </IconButton>
                                </div>
                            </InputAdornment>
                        ) : null,
                },
                htmlInput: { readOnly: readonly },
                inputLabel: { shrink: readonly || undefined },
            }}
            dir={getTextDirection(value, schema)}
            data-hide-error={hideError}
            data-hide-label={hideLabel}
        />
    );
};

export default RjsfTextWidget;
