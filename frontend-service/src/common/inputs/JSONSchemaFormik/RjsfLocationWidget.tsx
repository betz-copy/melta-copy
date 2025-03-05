/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React, { useEffect, useState } from 'react';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Box, Dialog, InputAdornment, TextField } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { getTextDirection } from '../../../utils/stringValues';
import { environment } from '../../../globals';
import LocationField from '../../../pages/Map/LocationField';
import './widget.css';

const { polygonPrefix, polygonSuffix } = environment.map.polygon;

export enum SplitBy {
    space = ' ',
    comma = ',',
}

const validatePoint = (pointString: string, splitBy: SplitBy) => {
    const [longitude, latitude] = pointString.split(splitBy).map(Number);
    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
        return false;
    }
    return true;
};

export const validateLocation = (value: string) => {
    if (value === '') return true;
    if (!value.startsWith(polygonPrefix)) return validatePoint(value, SplitBy.comma);

    if (!value.startsWith(polygonPrefix) || !value.endsWith(polygonSuffix)) {
        return false;
    }

    const coordsStr = value.slice(polygonPrefix.length, -polygonSuffix.length);
    return coordsStr.split(SplitBy.comma).every((stringedLocation: string) => validatePoint(stringedLocation, SplitBy.space));
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
    const [mapOpen, setMapOpen] = useState(false);
    const [newLocationValue, setNewLocationValue] = useState<string | undefined>(value);

    const displayLabel = getDisplayLabel(validator, schema, uiSchema, registry.rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const hasError = validateLocation(newValue) === false;
        setError(hasError);
        onChange(newValue === '' ? options.emptyValue : newValue);
    };

    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';

    const handleCloseDialog = () => {
        onChange(newLocationValue);
        setMapOpen(false);
    };

    useEffect(() => {
        setNewLocationValue(value);
    }, [value]);

    return (
        <Box>
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
                    startAdornment: (
                        <InputAdornment position="start" onClick={() => (error ? '' : setMapOpen(true))} style={{ cursor: 'pointer' }}>
                            <MapIcon color={readonly || error ? 'disabled' : 'action'} />
                        </InputAdornment>
                    ),
                }}
                type={(options.inputType ?? inputType) as string}
                value={newLocationValue}
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
                    defaultLocation={newLocationValue}
                    field={label}
                    updateValue={(newVal: string | undefined) => setNewLocationValue(newVal)}
                />
            </Dialog>
        </Box>
    );
};

export default RjsfLocationWidget;
