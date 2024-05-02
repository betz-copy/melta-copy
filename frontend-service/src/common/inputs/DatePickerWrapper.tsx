import React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import i18next from 'i18next';
import heLocale from 'date-fns/locale/he';

const DatePickerWrapper: React.FC<any> = ({ label, value, onChange, minDate, maxDate, sx, components, isStartDate = false, directionIsRow }) => (
    <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={heLocale}
        localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
    >
        <DatePicker
            inputFormat="dd/MM/yyyy"
            minDate={minDate}
            maxDate={maxDate}
            label={label}
            value={value}
            onChange={onChange}
            renderInput={(params) => <TextField {...params} size="small" sx={sx} />}
            InputProps={{
                style: {
                    // eslint-disable-next-line no-nested-ternary
                    borderRadius: !directionIsRow ? '7px' : isStartDate ? '0px 7px 7px 0px' : '7px 0px 0px 7px',
                    backgroundColor: sx && 'white',
                },
            }}
            components={components}
        />
    </LocalizationProvider>
);

export default DatePickerWrapper;
