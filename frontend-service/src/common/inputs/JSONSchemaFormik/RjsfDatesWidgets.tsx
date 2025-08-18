/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
import { Alarm, CalendarToday } from '@mui/icons-material';
import { InputAdornment, TextField, TextFieldProps, styled } from '@mui/material';
import { LocalizationProvider, MobileDatePicker, MobileDateTimePicker, PickersLocaleText, dateTimePickerToolbarClasses } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePickerToolbar } from '@mui/x-date-pickers/DateTimePicker/DateTimePickerToolbar';
import { BaseToolbarProps } from '@mui/x-date-pickers/internals';
import { WidgetProps, getDisplayLabel } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React, { JSX, useEffect, useState } from 'react';

export const CustomDateTimePickerToolbar = styled(DateTimePickerToolbar)({
    [`& .${dateTimePickerToolbarClasses.timeContainer}`]: {
        direction: 'rtl',
    },
}) as (props: BaseToolbarProps<Date, Date | null>) => JSX.Element;

const getRjsfDateOrDateTimeWidget =
    (dateOrDateTime: 'date' | 'dateTime') =>
    ({
        id,
        required,
        readonly,
        disabled,
        label,
        value,
        onChange,
        onBlur,
        onFocus,
        autofocus,
        schema,
        uiSchema,
        rawErrors = [],
        formContext,
        registry,
        color,
        options,
        hideError,
        hideLabel,
        ...textFieldProps
    }: WidgetProps) => {
        const { defaultValue } = options;
        const [currDate, setCurrDate] = useState<Date | null>((defaultValue as Date | undefined) ?? null);

        const { rootSchema } = registry;
        const displayLabel = getDisplayLabel(validator, schema, uiSchema, rootSchema);

        const MuiDatePicker = dateOrDateTime === 'date' ? MobileDatePicker : MobileDateTimePicker;

        useEffect(() => {
            if (value) setCurrDate(value);
            else if (defaultValue) setCurrDate(new Date(defaultValue as string));
        }, [value]);

        const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => {
            const isEmpty = !newValue;
            if (isEmpty) onChange(defaultValue);
            onBlur(id, isEmpty ? defaultValue : newValue);
        };
        const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

        const onChangeDateWidget = (date: Date | null) => {
            if (!date) return onChange(undefined);
            const dateString = format(date, 'yyyy-MM-dd');
            return onChange(dateString);
        };
        const onChangeDateTimeWidget = (date: Date | null) => {
            if (!date) return onChange(undefined);
            const dateString = date.toISOString();
            return onChange(dateString);
        };

        const onFormChangeFunction = dateOrDateTime === 'date' ? onChangeDateWidget : onChangeDateTimeWidget;

        const handleOpenDateOrDateTimePicker = () => {
            if (currDate) return;

            const currentDate = new Date();
            setCurrDate(currentDate);
            onFormChangeFunction(currentDate);
        };

        const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';
        return (
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={he}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText<unknown>}
            >
                <MuiDatePicker<Date, Date>
                    value={currDate}
                    onChange={(val) => {
                        setCurrDate(val);
                        onFormChangeFunction(val);
                    }}
                    inputFormat={dateOrDateTime === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                    showToolbar
                    componentsProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] } }}
                    label={!hideLabel && (displayLabel ? label || schema.title : false)}
                    renderInput={(params) => (
                        <TextField
                            {...textFieldProps}
                            color={color as TextFieldProps['color']}
                            {...params}
                            id={id}
                            required={required}
                            onBlur={_onBlur}
                            onFocus={_onFocus}
                            error={!hideError && rawErrors.length > 0}
                            variant={variant}
                            InputLabelProps={{ shrink: readonly || undefined }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" style={{ cursor: 'pointer' }}>
                                        {dateOrDateTime === 'date' ? (
                                            <CalendarToday fontSize="small" color={!readonly ? 'action' : 'disabled'} />
                                        ) : (
                                            <Alarm fontSize="small" color={!readonly ? 'action' : 'disabled'} />
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                            placeholder={defaultValue?.toString()}
                        />
                    )}
                    readOnly={readonly}
                    disabled={disabled}
                    autoFocus={autofocus}
                    onOpen={handleOpenDateOrDateTimePicker}
                    data-hide-error={hideError}
                    data-hide-label={hideLabel}
                />
            </LocalizationProvider>
        );
    };

export const RjsfDateWidget = getRjsfDateOrDateTimeWidget('date');
export const RjsfDateTimeWidget = getRjsfDateOrDateTimeWidget('dateTime');
