import { Map as MapIcon } from '@mui/icons-material';
import { Autocomplete, Box, Dialog, InputAdornment, TextField } from '@mui/material';
import { SplitBy } from '@packages/common';
import {
    CoordinateSystem,
    extractUtmLocation,
    isValidUTM,
    isValidWGS84,
    locationConverterToString,
    mapConfig,
    stringToCoordinates,
} from '@packages/map';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Cartesian3 } from 'cesium';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { LocationData } from '../../../../interfaces/location';
import LocationField from '../../../../pages/Map/LocationField';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';
import { CleanViewRow, isCleanView } from './CleanView';

const { polygonPrefix, polygonSuffix } = mapConfig.polygon;

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
    hideError,
    hideLabel,
    ...textFieldProps
}: WidgetProps) => {
    const getInitialLocation = (location: string | LocationData | undefined) => {
        if (!location) return undefined;
        if (typeof location === 'string') return location.includes('location') ? JSON.parse(value).location : value;
        return location?.coordinateSystem === CoordinateSystem.UTM
            ? locationConverterToString(location.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
            : value.location;
    };

    const [error, setError] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [newLocationValue, setNewLocationValue] = useState<string | undefined>('');

    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        setNewLocationValue(getInitialLocation(value));
    }, []);

    const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>(
        typeof value === 'string' && value.includes('coordinateSystem')
            ? JSON.parse(value).coordinateSystem
            : value?.coordinateSystem || CoordinateSystem.WGS84,
    );

    const displayLabel = getDisplayLabel(validator, schema, uiSchema, registry.rootSchema);
    const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`;

    const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        const hasError = validateLocation({ location: newValue, coordinateSystem }) === false;
        setError(hasError);

        const locationObj = newValue.toString().trim() ? { location: newValue, coordinateSystem } : undefined;
        onChange(JSON.stringify(locationObj) || undefined);
        setNewLocationValue(newValue);
    };

    const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, { location: newValue, coordinateSystem });
    const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, { location: newValue, coordinateSystem });

    const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';

    const handleCloseDialog = () => {
        onChange(newLocationValue?.length ? JSON.stringify({ location: newLocationValue, coordinateSystem }) : undefined);
        setMapOpen(false);
    };

    if (isCleanView(readonly, formContext)) {
        let parsedValue: string | LocationData | undefined = value as string | LocationData | undefined;

        if (typeof value === 'string' && value.includes('coordinateSystem')) {
            try {
                parsedValue = JSON.parse(value) as LocationData;
            } catch {
                parsedValue = value;
            }
        }

        const locationValue = typeof parsedValue === 'string' ? parsedValue : parsedValue?.location;
        const coordinateSystemValue = typeof parsedValue === 'string' ? undefined : parsedValue?.coordinateSystem;
        const cleanValue = coordinateSystemValue ? `${locationValue} (${coordinateSystemValue})` : locationValue;

        return <CleanViewRow label={label || schema.title} value={cleanValue} />;
    }

    return (
        <Box width="100%">
            <Box width="100%" display="flex" gap={1}>
                <Box width="70%">
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
                            slotProps={{
                                inputLabel: {
                                    shrink: readonly || undefined,
                                },
                                input: {
                                    disableUnderline: readonly,
                                    startAdornment: readonly ? null : (
                                        <InputAdornment
                                            position="start"
                                            onClick={() => (error ? '' : setMapOpen(true))}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <MapIcon color={error ? 'disabled' : 'action'} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            type={(options.inputType ?? inputType) as string}
                            value={newLocationValue ?? ''}
                            error={error || !!rawErrors.length}
                            onChange={_onChange}
                            onBlur={_onBlur}
                            onFocus={_onFocus}
                            onWheel={(e) => {
                                if (inputType === 'number') (e.target as HTMLElement).blur();
                            }}
                            dir="ltr"
                        />
                    </MeltaTooltip>
                </Box>
                <Box width="30%">
                    <Autocomplete
                        value={coordinateSystem}
                        onChange={(_, newValue: CoordinateSystem) => {
                            setCoordinateSystem(newValue);
                            if (!newLocationValue) return;

                            const hasError = validateLocation({ location: newLocationValue, coordinateSystem: newValue }) === false;
                            setError(hasError);

                            const convertedLocation = validateLocation({ location: newLocationValue, coordinateSystem }, true)
                                ? locationConverterToString(newLocationValue, coordinateSystem, newValue)
                                : newLocationValue;

                            setNewLocationValue(convertedLocation);
                            onChange(
                                newLocationValue?.toString().trim()
                                    ? JSON.stringify({ location: convertedLocation, coordinateSystem: newValue })
                                    : undefined,
                            );
                        }}
                        options={[CoordinateSystem.WGS84, CoordinateSystem.UTM]}
                        renderInput={(params) => <TextField {...params} label={i18next.t('location.coordinateSystem')} variant={variant} />}
                        disableClearable
                        sx={{ borderRadius: '10px', borderColor: '#787C9E', height: '40px' }}
                    />
                </Box>
            </Box>
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
                    handleCloseDialog={handleCloseDialog}
                />
            </Dialog>
        </Box>
    );
};

export default RjsfLocationWidget;
