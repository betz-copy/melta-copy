/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Box, Dialog, InputAdornment, TextField } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { getTextDirection } from '../../../utils/stringValues';
import { environment } from '../../../globals';
import LocationField from '../../../pages/Map/mapPage/Resuim/LocationField';

const { polygon, polygonPrefix, polygonSuffix } = environment.map.polygon;

export const validateLocation = (value: string) => {
    const locationString = value.trim();

    const [longitude, latitude] = locationString
        .split(',')
        .map((v) => v.trim())
        .map(Number);

    if (locationString.startsWith(polygon)) {
        if (locationString.startsWith(polygonPrefix) && locationString.endsWith(polygonSuffix)) {
            const coordinates = locationString.slice(polygonPrefix.length, -polygonSuffix.length).split(',');
            for (let i = 0; i < coordinates.length; i++) {
                const [lng, lat] = coordinates[i].split(' ').map(Number);
                if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
            }
            return true;
        }
        return false;
    }

    return !Number.isNaN(longitude) && !Number.isNaN(latitude);
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
    const [newLocationValue, setNewLocationValue] = useState<string>(value);

    const displayLabel = getDisplayLabel(validator, schema, uiSchema, registry.rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        setError(validateLocation(newValue));
        onChange(newValue === '' ? options.emptyValue : newValue);
    };

    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';

    const handleCloseDialog = () => {
        onChange(newLocationValue);
        setMapOpen(false);
    };

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
                    edit={{ defaultLocation: newLocationValue, field: label, updateValue: (newVal: string) => setNewLocationValue(newVal) }}
                />
            </Dialog>
        </Box>
    );
};

export default RjsfLocationWidget;
