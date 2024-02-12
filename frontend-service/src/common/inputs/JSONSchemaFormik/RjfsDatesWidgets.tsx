/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
// import { styled, TextField, TextFieldProps } from '@mui/material';
import i18next from 'i18next';
import { WidgetProps, getDisplayLabel } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import {
    // dateTimePickerToolbarClasses,
    LocalizationProvider,
    MobileDatePicker,
    MobileDateTimePicker,
    PickersActionBarAction,
} from '@mui/x-date-pickers';
// import heLocale from 'date-fns/locale/he';
import format from 'date-fns/format';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { DateTimePickerToolbar } from '@mui/x-date-pickers/DateTimePicker/DateTimePickerToolbar';
// import { BaseToolbarProps } from '@mui/x-date-pickers/internals';

// const CustomDateTimePickerToolbar = styled(DateTimePickerToolbar)({
//     [`& .${dateTimePickerToolbarClasses.timeContainer}`]: {
//         display: 'flex',
//         flexDirection: 'row-reverse', // support rtl! see issue https://github.com/mui/mui-x/issues/5561
//     },
// }) as unknown as (props: JSXElementConstructor<DatePickerToolbarProps<Date>>) => JSX.Element;

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
        uischema,
        rawErrors = [],
        formContext,
        registry,
        color,
    }: // ...textFieldProps
    WidgetProps) => {
        // const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
        // const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

        const [currDate, setCurrDate] = React.useState<Date | null>(value);

        const { rootSchema } = registry;
        const displayLabel = getDisplayLabel(validator, schema, uischema, rootSchema);

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

        // const handleOpenDatePicker = () => {
        //     if (currDate) return;

        //     const currentDate = new Date();
        //     setCurrDate(currentDate);

        //     if (dateOrDateTime === 'dateTime') {
        //         return onChange(currentDate.toISOString());
        //     }

        //     return onChange(format(currentDate, 'yyyy-MM-dd'));
        // };

        const onFormChangeFunction = dateOrDateTime === 'date' ? onChangeDateWidget : onChangeDateTimeWidget;
        // const variant = readonly ? 'standard' : 'outlined';
        type CustomActionBarAction = PickersActionBarAction & { name: string };

        return (
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                // adapterLocale={heLocale}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
            >
                <MuiDatePicker<Date>
                    value={currDate || null}
                    onChange={(val) => {
                        setCurrDate(val);
                        onFormChangeFunction(val);
                    }}
                    format={dateOrDateTime === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                    // componentsProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] } }}
                    slotProps={{
                        actionBar: ({ wrapperVariant }) => ({
                            actions:
                                wrapperVariant === 'desktop'
                                    ? []
                                    : ([{ name: 'clear' }, { name: 'cancel' }, { name: 'accept' }] as CustomActionBarAction[]),
                        }),
                        toolbar: {
                            toolbarPlaceholder: '__',
                            toolbarFormat: 'DD / MM / YYYY',
                            hidden: false,
                        },
                        textField: { variant: 'outlined' },
                    }}
                    label={displayLabel ? label || schema.title : false}
                    // renderInput={(params) => {
                    //     return (
                    //         <TextField
                    //             {...textFieldProps}
                    //             color={color as TextFieldProps['color']}
                    //             {...params}
                    //             id={id}
                    //             required={required}
                    //             onBlur={_onBlur}
                    //             onFocus={_onFocus}
                    //             error={rawErrors.length > 0}
                    //             variant={variant}
                    //             InputLabelProps={{
                    //                 shrink: readonly || undefined,
                    //             }}
                    //         />
                    //     );
                    // }}
                    readOnly={readonly}
                    disabled={disabled}
                    autoFocus
                    // toolbarFormat="dd/MM"
                    ampm={false}
                    // onOpen={handleOpenDatePicker}
                    // slots={{ toolbar: CustomDateTimePickerToolbar }}
                    // ToolbarComponent={CustomDateTimePickerToolbar}
                    disableHighlightToday
                />
            </LocalizationProvider>
        );
    };

export const RjfsDateWidget = getRjfsDateOrDateTimeWidget('date');
export const RjfsDateTimeWidget = getRjfsDateOrDateTimeWidget('dateTime');
