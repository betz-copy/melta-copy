import { TextField } from '@mui/material';
import { LocalizationProvider, MobileDatePicker, PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React from 'react';
import { CustomDateTimePickerToolbar } from '../../common/inputs/JSONSchemaFormik/RjsfDatesWidgets';
import { environment } from '../../globals';
import { useDarkModeStore } from '../../stores/darkMode';

const { date: dateFormat } = environment.formats;

const DateFilterComponent: React.FC<{
    date: Date;
    onDateChange: (newDate: Date | null) => void;
}> = ({ date, onDateChange }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ all: 'unset', display: 'block' }}
        >
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={he}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText}
            >
                <MobileDatePicker
                    value={date}
                    onChange={onDateChange}
                    format={dateFormat}
                    enableAccessibleFieldDOMStructure={false}
                    label={i18next.t('wizard.date')}
                    slots={{
                        toolbar: CustomDateTimePickerToolbar,
                        textField: (params) => <TextField {...params} />,
                    }}
                    slotProps={{
                        textField: { fullWidth: true },
                        dialog: {
                            PaperProps: {
                                sx: {
                                    backgroundColor: darkMode ? '#040404' : '#fff',
                                },
                            },
                        },
                        actionBar: { actions: ['cancel', 'accept'] },
                    }}
                />
            </LocalizationProvider>
        </button>
    );
};

export { DateFilterComponent };
