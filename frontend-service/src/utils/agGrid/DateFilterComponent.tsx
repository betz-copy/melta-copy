import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { MobileDatePicker, LocalizationProvider } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
