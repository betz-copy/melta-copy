import React, { useEffect, useState } from 'react';
import { TextField, FormControl } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import heLocale from 'date-fns/locale/he';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import i18next from 'i18next';
import { CustomDateTimePickerToolbar } from '../../common/inputs/JSONSchemaFormik/RjfsDatesWidgets';

interface DateTimeCellEditorProps {
    value: string | Date | null;
    onValueChange: (newValue: string | Date | null) => void;
}

const DateTimeCellEditor: React.FC<DateTimeCellEditorProps> = ({ value, onValueChange }) => {
    const [selectedValue, setSelectedValue] = useState<Date | null>(value ? new Date(value) : null);

    useEffect(() => {
        if (value) {
            setSelectedValue(new Date(value));
        }
    }, [value]);

    const handleDateChange = (newValue: Date | null) => {
        setSelectedValue(newValue);
        onValueChange(newValue);
    };

    return (
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={heLocale}
            localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
        >
            <FormControl fullWidth>
                <DateTimePicker
                    value={selectedValue}
                    onChange={handleDateChange}
                    componentsProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] } }}
                    renderInput={(params) => <TextField {...params} />}
                    ampm={false}
                    disableOpenPicker={false}
                    ToolbarComponent={CustomDateTimePickerToolbar}
                />
            </FormControl>
        </LocalizationProvider>
    );
};

export default DateTimeCellEditor;
