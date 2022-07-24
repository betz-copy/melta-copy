/* eslint-disable no-underscore-dangle */
/* eslint-disable no-shadow */
import React, { useContext } from 'react';
import { WidgetProps, utils } from '@rjsf/core';
import { MuiComponentContext } from '@rjsf/material-ui';
import { LocalizationProvider, MobileDatePicker, MobileDateTimePicker } from '@mui/x-date-pickers';
import { he } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CustomDateTimePickerToolbar from './CustomPickersToolbar';

export function useMuiComponent() {
    const muiComponents = useContext(MuiComponentContext);

    if (!muiComponents) {
        throw new Error('Either v4 or v5 of material-ui components and icons must be installed as dependencies');
    }

    return muiComponents;
}

const { getDisplayLabel } = utils;

const getRjfsDateOrDateTimeWidget =
    (dateOrDateTime: 'date' | 'dateTime') =>
    ({
        id,
        placeholder, // not used
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
        ...textFieldProps
    }: WidgetProps) => {
        const { TextField } = useMuiComponent();
        const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value);
        const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

        const { rootSchema } = registry;
        const displayLabel = getDisplayLabel(schema, uiSchema, rootSchema);

        const MuiDatePicker = dateOrDateTime === 'date' ? MobileDatePicker : MobileDateTimePicker;
        const onChangeDateWidget = (date: Date | null) => {
            if (!date) {
                return onChange(undefined);
            }
            const dateString = date.toISOString().split('T')[0];
            return onChange(dateString);
        };
        const onChangeDateTimeWidget = (date: Date | null) => {
            if (!date) {
                return onChange(undefined);
            }
            const dateString = date.toISOString();
            return onChange(dateString);
        };

        return (
            <LocalizationProvider dateAdapter={AdapterDateFns} locale={he}>
                <MuiDatePicker
                    value={value ? new Date(value) : null}
                    onChange={dateOrDateTime === 'date' ? onChangeDateWidget : onChangeDateTimeWidget}
                    inputFormat={dateOrDateTime === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                    showToolbar
                    clearable
                    label={displayLabel ? label || schema.title : false}
                    renderInput={(params) => (
                        <TextField
                            {...textFieldProps}
                            {...params}
                            id={id}
                            required={required}
                            onBlur={_onBlur}
                            onFocus={_onFocus}
                            error={rawErrors.length > 0}
                        />
                    )}
                    readOnly={readonly}
                    disabled={disabled}
                    autoFocus={autofocus}
                    toolbarFormat="dd/MM"
                    ampm={false}
                    ToolbarComponent={CustomDateTimePickerToolbar}
                />
            </LocalizationProvider>
        );
    };

export const RjfsDateWidget = getRjfsDateOrDateTimeWidget('date');
export const RjfsDateTimeWidget = getRjfsDateOrDateTimeWidget('dateTime');
