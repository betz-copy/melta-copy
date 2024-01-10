/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { styled, TextField, TextFieldProps } from '@mui/material';
import i18next from 'i18next';
import { WidgetProps, getDisplayLabel } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { LocalizationProvider, MobileDatePicker, MobileDateTimePicker } from '@mui/x-date-pickers';
import heLocale from 'date-fns/locale/he';
import format from 'date-fns/format';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePickerToolbar, dateTimePickerToolbarClasses } from '@mui/x-date-pickers/DateTimePicker/DateTimePickerToolbar';
import { BaseToolbarProps } from '@mui/x-date-pickers/internals';

const CustomDateTimePickerToolbar = styled(DateTimePickerToolbar)({
    [`& .${dateTimePickerToolbarClasses.timeContainer}`]: {
        display: 'flex',
        flexDirection: 'row-reverse', // support rtl! see issue https://github.com/mui/mui-x/issues/5561
    },
}) as (props: BaseToolbarProps<Date, Date | null>) => JSX.Element;

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
        color,
        ...textFieldProps
    }: WidgetProps) => {
        const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
        const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

        const [currDate, setCurrDate] = React.useState<Date | null>(value);

        const { rootSchema } = registry;
        const displayLabel = getDisplayLabel(validator, schema, uiSchema, rootSchema);

        const MuiDatePicker = dateOrDateTime === 'date' ? MobileDatePicker : MobileDateTimePicker;
        const onChangeDateWidget = (date: Date | null) => {
            if (!date) {
                return onChange(undefined);
            }
            const dateString = format(date, 'yyyy-MM-dd');
            return onChange(dateString);
        };
        const onChangeDateTimeWidget = (date: Date | null) => {
            if (!date) {
                return onChange(undefined);
            }
            const dateString = date.toISOString();
            return onChange(dateString);
        };

        const handleOpenDatePicker = () => {
            if (currDate) return;

            const currentDate = new Date();
            setCurrDate(currentDate);

            if (dateOrDateTime === 'dateTime') {
                return onChange(currentDate.toISOString());
            }

            return onChange(format(currentDate, 'yyyy-MM-dd'));
        };

        const onFormChangeFunction = dateOrDateTime === 'date' ? onChangeDateWidget : onChangeDateTimeWidget;
        const variant = readonly ? 'standard' : 'outlined';
        return (
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={heLocale}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
            >
                <MuiDatePicker<Date, Date>
                    value={currDate || null}
                    onChange={(val) => {
                        setCurrDate(val);
                        onFormChangeFunction(val);
                    }}
                    inputFormat={dateOrDateTime === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                    showToolbar
                    componentsProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] } }}
                    label={displayLabel ? label || schema.title : false}
                    renderInput={(params) => {
                        return (
                            <TextField
                                size="small"
                                {...textFieldProps}
                                color={color as TextFieldProps['color']}
                                {...params}
                                id={id}
                                required={required}
                                onBlur={_onBlur}
                                onFocus={_onFocus}
                                error={rawErrors.length > 0}
                                variant={variant}
                                InputLabelProps={{
                                    shrink: readonly || undefined,
                                }}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: '10px',
                                    },
                                    '& fieldset': {
                                        borderColor: '#CCCFE5',
                                        color: '#CCCFE5',
                                    },
                                    '& label': {
                                        color: '#9398C2',
                                    },
                                }}
                            />
                        );
                    }}
                    readOnly={readonly}
                    disabled={disabled}
                    autoFocus={autofocus}
                    toolbarFormat="dd/MM"
                    ampm={false}
                    onOpen={handleOpenDatePicker}
                    ToolbarComponent={CustomDateTimePickerToolbar}
                />
            </LocalizationProvider>
        );
    };

export const RjfsDateWidget = getRjfsDateOrDateTimeWidget('date');
export const RjfsDateTimeWidget = getRjfsDateOrDateTimeWidget('dateTime');
