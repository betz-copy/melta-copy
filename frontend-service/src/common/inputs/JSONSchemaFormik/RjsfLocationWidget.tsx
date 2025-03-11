/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-underscore-dangle */
import React, { useEffect, useState } from 'react';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Cartesian3 } from 'cesium';
import { Box, Dialog, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import i18next from 'i18next';
import { environment } from '../../../globals';
import LocationField from '../../../pages/Map/LocationField';
import { stringToCoordinates } from '../../../utils/map';
import { extractUtmLocation, isValidUTM, isValidWGS84, locationConverterToString } from '../../../utils/map/convert';

const { polygonPrefix, polygonSuffix } = environment.map.polygon;

export interface LocationData {
    location: string;
    unit: 'WGS84' | 'UTM';
}

export enum SplitBy {
    space = ' ',
    comma = ',',
}

const validatePoint = (point: LocationData, splitBy: SplitBy, schemaValidation?: boolean) => {
    if (!schemaValidation) return true;

    switch (point.unit) {
        case 'WGS84': {
            const [longitude, latitude] = point.location.split(splitBy).map(Number);
            if (Number.isNaN(longitude) || Number.isNaN(latitude)) return false;

            const wgs84Location = stringToCoordinates(point.location).value as Cartesian3;

            return isValidWGS84(wgs84Location);
        }
        case 'UTM': {
            const [_zoneHemi, east, north] = point.location.split(splitBy).map(Number);
            if (Number.isNaN(east) || Number.isNaN(north)) return false;

            const utmLocation = extractUtmLocation(point.location);
            if (!utmLocation) return false;

            return isValidUTM(utmLocation);
        }
        default:
            return true;
    }
};

export const validateLocation = (value: LocationData, schemaValidation?: boolean) => {
    if (value.location === '') return true;
    if (!value.location.startsWith(polygonPrefix))
        return validatePoint(value, value.unit === 'UTM' ? SplitBy.space : SplitBy.comma, schemaValidation);

    if (!value.location.startsWith(polygonPrefix) || !value.location.endsWith(polygonSuffix)) return false;

    const coordsStr = value.location.slice(polygonPrefix.length, -polygonSuffix.length);
    return coordsStr
        .split(SplitBy.comma)
        .every((stringedLocation: string) => validatePoint({ location: stringedLocation, unit: value.unit }, SplitBy.space, schemaValidation));
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
    const getInitialLocation = (location) => {
        if (!location) return undefined;
        return location?.unit === 'UTM' ? locationConverterToString(location.location, 'WGS84', 'UTM') : value;
    };

    const [error, setError] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [newLocationValue, setNewLocationValue] = useState<string | undefined>('');

    useEffect(() => {
        setNewLocationValue(getInitialLocation(value));
    }, []);

    const [coordinateSystem, setCoordinateSystem] = useState<'WGS84' | 'UTM'>(value?.unit || 'WGS84');

    const displayLabel = getDisplayLabel(validator, schema, uiSchema, registry.rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const hasError = validateLocation({ location: newValue, unit: coordinateSystem }) === false;
        setError(hasError);

        const locationObj = newValue.toString().trim() ? { location: newValue, unit: coordinateSystem } : undefined;
        onChange(locationObj || undefined);
        setNewLocationValue(newValue);
    };

    const onChangeUnit = ({ target: { value: newUnit } }) => {
        setCoordinateSystem(newUnit);
        if (!newLocationValue) return;

        const hasError = validateLocation({ location: newLocationValue, unit: newUnit }) === false;
        setError(hasError);

        const convertedLocation = validateLocation({ location: newLocationValue, unit: coordinateSystem }, true)
            ? locationConverterToString(newLocationValue, coordinateSystem, newUnit)
            : newLocationValue;

        setNewLocationValue(convertedLocation);
        onChange(newLocationValue?.toString().trim() ? { location: convertedLocation, unit: newUnit } : undefined);
    };

    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) =>
        onBlur(id, { location: newValue, unit: coordinateSystem });
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) =>
        onFocus(id, { location: newValue, unit: coordinateSystem });

    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';

    const handleCloseDialog = () => {
        onChange({ location: newLocationValue, unit: coordinateSystem });
        setMapOpen(false);
    };

    return (
        <Box width="100%">
            <Grid container justifyContent="space-between" alignItems="center" width="100%">
                <Grid item xs={8.5}>
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
                            if (inputType === 'number') (e.target as HTMLElement).blur();
                        }}
                        dir="ltr"
                    />
                </Grid>
                <Grid item xs={3.25}>
                    <FormControl fullWidth variant={variant}>
                        <InputLabel sx={{ color: '#787C9E' }}>{i18next.t('location.unit')}</InputLabel>
                        <Select
                            value={coordinateSystem}
                            onChange={onChangeUnit}
                            label="Unit"
                            sx={{ height: '40px', borderRadius: '10px', borderColor: '#787C9E' }}
                        >
                            <MenuItem value="WGS84">{i18next.t('location.WGS84')}</MenuItem>
                            <MenuItem value="UTM">{i18next.t('location.UTM')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Dialog open={mapOpen} onClose={handleCloseDialog}>
                <LocationField
                    defaultLocation={newLocationValue && coordinateSystem === 'UTM' ? locationConverterToString(newLocationValue) : newLocationValue}
                    field={label}
                    updateValue={(newVal: string | undefined) => {
                        if (coordinateSystem === 'UTM' && newVal) setNewLocationValue(locationConverterToString(newVal, 'WGS84', coordinateSystem));
                        else setNewLocationValue(newVal);
                    }}
                />
            </Dialog>
        </Box>
    );
};

export default RjsfLocationWidget;
