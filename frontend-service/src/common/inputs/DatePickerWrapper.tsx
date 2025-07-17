import React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import i18next from 'i18next';
import heLocale from 'date-fns/locale/he';
import { SxProps } from '@mui/material';
import { DatePickerSlotsComponent } from '@mui/x-date-pickers/DatePicker/DatePicker';

interface DatePickerWrapperProps {
    label?: string;
    value?: Date | string | null;
    onChange: (date: Date | null) => void;
    minDate?: Date | string | null;
    maxDate?: Date | string | null;
    sx?: SxProps;
    components?: Partial<DatePickerSlotsComponent>;
    isStartDate?: boolean;
    directionIsRow?: boolean;
    readOnly?: boolean;
    borderRadius?: string;
    disableKeyboardInput?: boolean;
}

const DatePickerWrapper: React.FC<DatePickerWrapperProps> = ({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    sx,
    components,
    isStartDate = false,
    directionIsRow,
    readOnly = false,
    borderRadius,
    disableKeyboardInput = false,
}) => (
    <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={heLocale}
        localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
    >
        <DatePicker
            inputFormat="dd/MM/yyyy"
            minDate={minDate ? new Date(minDate) : undefined}
            maxDate={maxDate ? new Date(maxDate) : undefined}
            label={label}
            value={value}
            onChange={onChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    sx={{
                        boxSizing: 'border-box',
                        width: '100%',
                        ...sx,
                    }}
                    inputProps={{
                        ...params.inputProps,
                        readOnly: disableKeyboardInput,
                    }}
                />
            )}
            InputProps={{
                style: {
                    borderRadius: borderRadius || !directionIsRow ? '7px' : isStartDate ? '0px 7px 7px 0px' : '7px 0px 0px 7px',
                },
            }}
            components={components}
            readOnly={readOnly}
            disabled={readOnly}
        />
    </LocalizationProvider>
);

export default DatePickerWrapper;
