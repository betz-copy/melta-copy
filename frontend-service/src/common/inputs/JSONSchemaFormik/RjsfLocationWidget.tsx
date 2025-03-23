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
import { MeltaTooltip } from '../../MeltaTooltip';

const { polygonPrefix, polygonSuffix } = environment.map.polygon;

export enum CoordinateSystem {
    UTM = 'UTM',
    WGS84 = 'WGS84',
}
export interface LocationData {
    location: string;
    coordinateSystem: CoordinateSystem;
}

export enum SplitBy {
    space = ' ',
    comma = ',',
}

const validatePoint = (point: LocationData, splitBy: SplitBy, schemaValidation?: boolean) => {
    if (!schemaValidation) return true;

    switch (point.coordinateSystem) {
        case CoordinateSystem.WGS84: {
            const parts = point.location.split(splitBy).map(Number);
            if (parts.length !== 2) return false;

            const [longitude, latitude] = parts;
            if (Number.isNaN(longitude) || Number.isNaN(latitude)) return false;

            const wgs84Location = stringToCoordinates(point.location).value as Cartesian3;
            return isValidWGS84(wgs84Location);
        }
        case CoordinateSystem.UTM: {
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
        return validatePoint(value, value.coordinateSystem === CoordinateSystem.UTM ? SplitBy.space : SplitBy.comma, schemaValidation);

    if (!value.location.startsWith(polygonPrefix) || !value.location.endsWith(polygonSuffix)) return false;

    return value.location
        .slice(polygonPrefix.length, -polygonSuffix.length)
        .split(SplitBy.comma)
        .every((stringedLocation: string) =>
            validatePoint({ location: stringedLocation, coordinateSystem: value.coordinateSystem }, SplitBy.space, schemaValidation),
        );
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
    const getInitialLocation = (location: string | LocationData | undefined) => {
        if (!location) return undefined;
        if (typeof location === 'string') return value;
        return location?.coordinateSystem === CoordinateSystem.UTM
            ? locationConverterToString(location.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
            : value.location;
    };

    const [error, setError] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [newLocationValue, setNewLocationValue] = useState<string | undefined>('');

    useEffect(() => {
        setNewLocationValue(getInitialLocation(value));
    }, []);

    const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>(value?.coordinateSystem || CoordinateSystem.WGS84);

    const displayLabel = getDisplayLabel(validator, schema, uiSchema, registry.rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const hasError = validateLocation({ location: newValue, coordinateSystem }) === false;
        setError(hasError);

        const locationObj = newValue.toString().trim() ? { location: newValue, coordinateSystem } : undefined;
        onChange(locationObj || undefined);
        setNewLocationValue(newValue);
    };

    const onChangeCoordinateSystem = ({ target: { value: newCoordinateSystem } }) => {
        setCoordinateSystem(newCoordinateSystem);
        if (!newLocationValue) return;

        const hasError = validateLocation({ location: newLocationValue, coordinateSystem: newCoordinateSystem }) === false;
        console.log({ hasError });

        setError(hasError);

        const convertedLocation = validateLocation({ location: newLocationValue, coordinateSystem }, true)
            ? locationConverterToString(newLocationValue, coordinateSystem, newCoordinateSystem)
            : newLocationValue;

        setNewLocationValue(convertedLocation);
        onChange(newLocationValue?.toString().trim() ? { location: convertedLocation, coordinateSystem: newCoordinateSystem } : undefined);
    };

    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, { location: newValue, coordinateSystem });
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, { location: newValue, coordinateSystem });

    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';

    const handleCloseDialog = () => {
        onChange({ location: newLocationValue, coordinateSystem });
        setMapOpen(false);
    };

    return (
        <Box width="100%">
            <Grid container justifyContent="space-between" alignItems="center" width="100%">
                <Grid item xs={8.5}>
                    <MeltaTooltip title={newLocationValue}>
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
                                if (inputType === 'number') (e.target as HTMLElement).blur();
                            }}
                            dir="ltr"
                        />
                    </MeltaTooltip>
                </Grid>
                <Grid item xs={3.25}>
                    <FormControl fullWidth variant={variant}>
                        <InputLabel sx={{ color: '#787C9E' }}>{i18next.t('location.coordinateSystem')}</InputLabel>
                        <Select
                            value={coordinateSystem}
                            onChange={onChangeCoordinateSystem}
                            sx={{ height: '40px', borderRadius: '10px', borderColor: '#787C9E' }}
                        >
                            <MenuItem value={CoordinateSystem.WGS84}>{CoordinateSystem.WGS84}</MenuItem>
                            <MenuItem value={CoordinateSystem.UTM}>{CoordinateSystem.UTM}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Dialog open={mapOpen} onClose={handleCloseDialog}>
                <LocationField
                    defaultLocation={
                        newLocationValue && coordinateSystem === CoordinateSystem.UTM ? locationConverterToString(newLocationValue) : newLocationValue
                    }
                    field={label}
                    updateValue={(newVal: string | undefined) => {
                        if (!newVal) {
                            setNewLocationValue('');
                            return;
                        }

                        if (coordinateSystem === CoordinateSystem.UTM && newVal)
                            setNewLocationValue(locationConverterToString(newVal, CoordinateSystem.WGS84, coordinateSystem));
                        else setNewLocationValue(newVal);
                    }}
                />
            </Dialog>
        </Box>
    );
};

export default RjsfLocationWidget;
