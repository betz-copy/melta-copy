import { TextField } from '@mui/material';
import { LocalizationProvider, MobileDatePicker, PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React from 'react';
import { CustomDateTimePickerToolbar } from '../../common/inputs/JSONSchemaFormik/Widgets/RjsfDatesWidgets';
import { DATE_PICKER_VIEWS, environment } from '../../globals';
import { useDarkModeStore } from '../../stores/darkMode';

const { date: dateFormat } = environment.formats;

const DateFilterComponent: React.FC<{ date: Date; onDateChange: (newDate: Date | null) => void }> = ({ date, onDateChange }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={he}
                localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText}
            >
                <MobileDatePicker
                    value={date}
                    onChange={onDateChange}
                    format={dateFormat}
                    views={DATE_PICKER_VIEWS}
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
        </div>
    );
};

export { DateFilterComponent };
