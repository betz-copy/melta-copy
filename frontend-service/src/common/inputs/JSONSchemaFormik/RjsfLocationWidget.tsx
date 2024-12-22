/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Dialog, InputAdornment, TextField } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { convertToPlainText, containsHTMLTags } from '../../../utils/HtmlTagsStringValue';
import { getFixedNumber, getTextDirection } from '../../../utils/stringValues';
import LocationField from '../../../pages/Map/LocationField';

export const validateLocation = (value: string) => {
    const locationString = value.trim();

    const [longitude, latitude] = locationString
        .split(',')
        .map((v) => v.trim())
        .map(Number);

    if (locationString.startsWith('POLYGON')) {
        const prefix = 'POLYGON((';
        const suffix = '))';
        if (locationString.startsWith(prefix) && locationString.endsWith(suffix)) {
            const coordinates = locationString.slice(prefix.length, -suffix.length).split(',');
            for (let i = 0; i < coordinates.length; i++) {
                const [lng, lat] = coordinates[i].split(' ').map(Number);
                if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
            }
            return true;
        }
        return false;
    }

    if (Number.isNaN(longitude) || Number.isNaN(latitude)) return false;
    return true;
};
const RjsfLocationWidget = ({
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
    ...textFieldProps
}: WidgetProps) => {
    const [error, setError] = useState(false);
    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const parsedValue = (type || schema.type) === 'number' && newValue !== '' ? Number(newValue) : newValue;
        setError(validateLocation(parsedValue.toString()));
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

    const [mapOpen, setMapOpen] = useState(false);
    const [newValue, setNewValue] = useState<string>(finalValue);

    const handleCloseDialog = () => {
        onChange(newValue);
        setMapOpen(false);
    };

    return (
        <>
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
                InputProps={{
                    [value === undefined ? 'endAdornment' : 'startAdornment']: (
                        <InputAdornment
                            position={value === undefined ? 'end' : 'start'}
                            onClick={() => (error ? '' : setMapOpen(true))}
                            style={{ cursor: 'pointer' }}
                        >
                            <MapIcon color={error ? 'disabled' : 'action'} />
                        </InputAdornment>
                    ),
                }}
                type={(options.inputType ?? inputType) as string}
                value={finalValue}
                error={error || rawErrors.length > 0}
                onChange={_onChange}
                onBlur={_onBlur}
                onFocus={_onFocus}
                onWheel={(e) => {
                    if (inputType === 'number') (e.target as HTMLElement).blur(); // disable number input scroll to change value when focused, but blurring it
                }}
                dir={getTextDirection(value, schema)}
            />

            <Dialog open={mapOpen} onClose={handleCloseDialog}>
                <LocationField
                    styles={{ height: '800px', width: '600px' }}
                    defaultLocation={finalValue}
                    updateValue={(newVal: string) => setNewValue(newVal)}
                />
            </Dialog>
        </>
    );
};

export default RjsfLocationWidget;
