import { SxProps } from '@mui/material';
import { PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../globals';

const { date } = environment.formats;

interface DatePickerWrapperProps {
    label?: string;
    value?: Date | string | null;
    onChange: (date: Date | null) => void;
    minDate?: Date | string | null;
    maxDate?: Date | string | null;
    sx?: SxProps;
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
    isStartDate = false,
    directionIsRow,
    readOnly = false,
    borderRadius,
    disableKeyboardInput = false,
}) => (
    <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={he}
        localeText={
            i18next.t('muiDatePickersLocaleText', {
                returnObjects: true,
            }) as PickersLocaleText
        }
    >
        <DatePicker
            format={date}
            views={['year', 'month', 'day']}
            yearsPerRow={4}
            minDate={minDate ? new Date(minDate) : undefined}
            maxDate={maxDate ? new Date(maxDate) : undefined}
            label={label}
            value={!value ? null : typeof value === 'string' ? new Date(value) : value}
            onChange={onChange}
            onAccept={onChange}
            readOnly={readOnly || disableKeyboardInput}
            disabled={readOnly}
            enableAccessibleFieldDOMStructure={false}
            slotProps={{
                field: {
                    readOnly: readOnly || disableKeyboardInput,
                },
                textField: {
                    sx: {
                        boxSizing: 'border-box',
                        width: '100%',
                        ...sx,
                        '& .MuiInputBase-root': {
                            borderRadius: borderRadius || (!directionIsRow ? '7px' : isStartDate ? '0px 7px 7px 0px' : '7px 0px 0px 7px'),
                        },
                    },
                },
            }}
        />
    </LocalizationProvider>
);

export default DatePickerWrapper;
