/* eslint-disable no-underscore-dangle */
/* eslint-disable no-shadow */
import React from 'react';
import { styled } from '@mui/material';
import i18next from 'i18next';
import { WidgetProps, utils } from '@rjsf/core';
import { LocalizationProvider, MobileDatePicker, MobileDateTimePicker } from '@mui/x-date-pickers';
import heLocale from 'date-fns/locale/he';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePickerToolbar, dateTimePickerToolbarClasses } from '@mui/x-date-pickers/DateTimePicker/DateTimePickerToolbar';
import { BaseToolbarProps } from '@mui/x-date-pickers/internals';
import { useMuiComponent } from './rjsfUseMuiComponent';

const CustomDateTimePickerToolbar = styled(DateTimePickerToolbar)({
    [`& .${dateTimePickerToolbarClasses.timeContainer}`]: {
        display: 'flex',
        flexDirection: 'row-reverse', // support rtl! see issue https://github.com/mui/mui-x/issues/5561
    },
}) as (props: BaseToolbarProps<Date, Date | null>) => JSX.Element;

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
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={heLocale}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
            >
                <MuiDatePicker<Date, Date>
                    value={value ? new Date(value) : null}
                    onChange={dateOrDateTime === 'date' ? onChangeDateWidget : onChangeDateTimeWidget}
                    inputFormat={dateOrDateTime === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                    showToolbar
                    componentsProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] } }}
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
