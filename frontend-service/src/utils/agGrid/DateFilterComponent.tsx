import React, { forwardRef, useImperativeHandle, useState } from 'react';
import i18next from 'i18next';
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import heLocale from 'date-fns/locale/he';
import { TextField } from '@mui/material';

const DateFilterComponent: React.FC<{ onDateChanged: () => void }> = forwardRef(({ onDateChanged }, ref) => {
    const [dateValue, setDateValue] = useState<Date | null>(null);

    const handleChange = (newValue: Date | null) => {
        setDateValue(newValue);
        onDateChanged(); // notify Ag-Grid on change
    };

    // functions for Ag-Grid
    useImperativeHandle(ref, () => ({
        getDate() {
            return dateValue;
        },
        setDate(date: Date | null) {
            setDateValue(date);
        },
    }));

    return (
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={heLocale}
            localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
        >
            <MobileDatePicker
                inputFormat="dd/MM/yyyy"
                value={dateValue}
                onChange={handleChange}
                renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
    );
});

export { DateFilterComponent };
