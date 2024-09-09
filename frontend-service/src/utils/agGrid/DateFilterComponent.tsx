import { TextField } from '@mui/material';
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import heLocale from 'date-fns/locale/he';
import i18next from 'i18next';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { CustomDateTimePickerToolbar } from '../../common/inputs/JSONSchemaFormik/RjfsDatesWidgets';
import { useDarkModeStore } from '../../stores/darkMode';

const DateFilterComponent: React.FC<{ onDateChanged: () => void }> = forwardRef(({ onDateChanged }, ref) => {
    const [dateValue, setDateValue] = useState<Date | null>(null);

    const darkMode = useDarkModeStore((state) => state.darkMode);

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
        <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={heLocale}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
            >
                <MobileDatePicker
                    inputFormat="dd/MM/yyyy"
                    value={dateValue}
                    onChange={handleChange}
                    showToolbar
                    componentsProps={{ actionBar: { actions: ['cancel', 'accept'] } }}
                    label={i18next.t('wizard.date')}
                    renderInput={(params) => <TextField {...params} />}
                    toolbarFormat="dd/MM"
                    ToolbarComponent={CustomDateTimePickerToolbar}
                    DialogProps={{
                        PaperProps: {
                            sx: {
                                backgroundColor: darkMode ? '#040404' : 'white',
                            },
                        },
                    }}
                />
            </LocalizationProvider>
        </div>
    );
});

export { DateFilterComponent };
