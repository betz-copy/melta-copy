/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
import { styled, TextFieldProps } from '@mui/material';
import { DateTimePickerToolbar, dateTimePickerToolbarClasses, LocalizationProvider, PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { BaseToolbarProps } from '@mui/x-date-pickers/internals';
import { getDisplayLabel, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React, { JSX } from 'react';
import { environment } from '../../../../globals';

const {
    formats: { date, dateTime },
    datePickerViews,
} = environment;

export const CustomDateTimePickerToolbar = styled(DateTimePickerToolbar)({
    [`& .${dateTimePickerToolbarClasses.timeContainer}`]: {
        direction: 'rtl',
    },
}) as (props: BaseToolbarProps) => JSX.Element;

const parseDefaultDate = (val: string | Date | undefined | null): Date | null => {
    if (!val) return null;

    const date = new Date(val);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

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
        const { rootSchema } = registry;

        const inputFormat = dateOrDateTime === 'date' ? date : dateTime;
        const variant = readonly && !schema.readOnly ? 'standard' : 'outlined';
        const displayLabel = getDisplayLabel(validator, schema, uiSchema, rootSchema);

        const MuiDatePicker = dateOrDateTime === 'date' ? DatePicker : DateTimePicker;

        const _onBlur = () => {};

        const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

        const onChangeDateWidget = (date: Date | null) => {
            if (!date) return onChange(undefined);
            const dateString = dateOrDateTime === 'date' ? format(date, 'yyyy-MM-dd') : date.toISOString();
            return onChange(dateString);
        };

        return (
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={he}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText}
            >
                <MuiDatePicker
                    value={parseDefaultDate(value)}
                    format={inputFormat}
                    enableAccessibleFieldDOMStructure={false}
                    {...(dateOrDateTime === 'date' && { views: datePickerViews })}
                    onChange={(val) => onChangeDateWidget(val)}
                    slotProps={{
                        textField: {
                            ...textFieldProps,
                            id,
                            required,
                            size: 'small',
                            color: color as TextFieldProps['color'],
                            variant,
                            onBlur: _onBlur,
                            onFocus: _onFocus,
                            error: !hideError && !!rawErrors.length,
                            InputLabelProps: { shrink: readonly || undefined },
                            placeholder: defaultValue?.toString(),
                        },
                        actionBar: { actions: ['clear', 'cancel'] },
                    }}
                    label={!hideLabel && (displayLabel ? label || schema.title : false)}
                    readOnly={readonly}
                    disabled={disabled}
                    autoFocus={autofocus}
                    data-hide-error={hideError}
                    data-hide-label={hideLabel}
                />
            </LocalizationProvider>
        );
    };

export const RjsfDateWidget = getRjsfDateOrDateTimeWidget('date');
export const RjsfDateTimeWidget = getRjsfDateOrDateTimeWidget('dateTime');
