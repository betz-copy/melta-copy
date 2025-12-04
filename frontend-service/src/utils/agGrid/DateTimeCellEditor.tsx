import { FormControl, TextField } from '@mui/material';
import { DatePicker, DateTimePicker, PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { CustomDateTimePickerToolbar } from '../../common/inputs/JSONSchemaFormik/Widgets/RjsfDatesWidgets';
import { environment } from '../../globals';

const { dateTime, date: dateFormat } = environment.formats;

interface DateTimeCellEditorProps {
    value: string | Date | null;
    onValueChange: (newValue: string | Date | null) => void;
    dateOrDateTime: 'date' | 'dateTime';
}

const DateTimeCellEditor: React.FC<DateTimeCellEditorProps> = ({ value, onValueChange, dateOrDateTime = 'date' }) => {
    const [selectedValue, setSelectedValue] = useState<Date | null>(value ? new Date(value) : null);

    useEffect(() => {
        if (value) {
            setSelectedValue(new Date(value));
        }
    }, [value]);

    const handleDateChange = (newValue: Date | null) => {
        setSelectedValue(newValue);
        // eslint-disable-next-line no-nested-ternary
        onValueChange(newValue === null ? null : dateOrDateTime === 'date' ? format(newValue, 'yyyy-MM-dd') : newValue);
    };

    return (
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={he}
            localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText}
        >
            <FormControl fullWidth>
                {dateOrDateTime === 'dateTime' ? (
                    <DateTimePicker
                        value={selectedValue}
                        onChange={handleDateChange}
                        format={dateTime}
                        enableAccessibleFieldDOMStructure={false}
                        ampm={false}
                        slots={{ toolbar: CustomDateTimePickerToolbar, textField: (params) => <TextField {...params} /> }}
                        slotProps={{
                            actionBar: { actions: ['clear', 'cancel', 'accept'] },
                            textField: { fullWidth: true },
                        }}
                    />
                ) : (
                    <DatePicker
                        value={selectedValue}
                        onChange={handleDateChange}
                        format={dateFormat}
                        enableAccessibleFieldDOMStructure={false}
                        slots={{ toolbar: CustomDateTimePickerToolbar, textField: (params) => <TextField {...params} /> }}
                        slotProps={{
                            actionBar: { actions: ['clear', 'cancel', 'accept'] },
                            textField: { fullWidth: true },
                        }}
                    />
                )}
            </FormControl>
        </LocalizationProvider>
    );
};

export default DateTimeCellEditor;
