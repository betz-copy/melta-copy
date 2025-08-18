import { SxProps } from '@mui/material';
import TextField from '@mui/material/TextField';
import { PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DatePickerSlotsComponent } from '@mui/x-date-pickers/DatePicker/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React from 'react';

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
        adapterLocale={he}
        localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText<unknown>}
    >
        <DatePicker
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
