import React from 'react';
import { Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import i18next from 'i18next';
import heLocale from 'date-fns/locale/he';
import DatePickerWrapper from './DatePickerWrapper';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | null;
    endDateInput: Date | null;
    overrideSx?: object;
}> = ({ onStartDateChange, onEndDateChange, startDateInput, endDateInput, overrideSx }) => {
    // const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Grid container justifyContent="center" alignItems="center" wrap="nowrap" spacing={overrideSx ? 2 : 0}>
            {/* <Grid item>
                <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={heLocale}
                    localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
                >
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        maxDate={new Date()}
                        label={i18next.t('processInstancesPage.startDate')}
                        value={startDateInput}
                        onChange={(newStartDate) => onStartDateChange(newStartDate)}
                        renderInput={(params) => <TextField {...params} size="small" sx={overrideSx} />}
                        InputProps={{
                            style: { borderRadius: '0px 7px 7px 0px', backgroundColor: overrideSx && 'white' },
                            // TODO - implement dark mode when it will be supported
                        }}
                        components={
                            overrideSx && {
                                // eslint-disable-next-line react/no-unstable-nested-components
                                OpenPickerIcon: () => <img src="/icons/calendar.svg" style={{ height: '20px' }} alt="calendar icon" />,
                            }
                        }
                    />
                </LocalizationProvider> */}

            <DatePickerWrapper
                label={i18next.t('processInstancesPage.startDate')}
                value={startDateInput}
                onChange={onStartDateChange}
                maxDate={new Date()}
                minDate={undefined}
                sx={overrideSx}
                components={
                    overrideSx && {
                        // eslint-disable-next-line react/no-unstable-nested-components
                        OpenPickerIcon: () => <img src="/icons/calendar.svg" style={{ height: '20px' }} alt="calendar icon" />,
                    }
                }
            />
            {/* </Grid> */}
            <Grid item className="processList-dateContainer">
                <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={heLocale}
                    localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
                >
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        className="react-datepicker-wrapper"
                        minDate={startDateInput}
                        maxDate={new Date()}
                        label={i18next.t('processInstancesPage.endDate')}
                        value={endDateInput}
                        onChange={(newEndDate) => onEndDateChange(newEndDate)}
                        renderInput={(params) => <TextField {...params} size="small" sx={overrideSx} />}
                        InputProps={{
                            style: { borderRadius: '7px 0px 0px 7px', backgroundColor: overrideSx && 'white' },
                        }}
                        components={
                            overrideSx && {
                                // eslint-disable-next-line react/no-unstable-nested-components
                                OpenPickerIcon: () => <img src="/icons/calendar.svg" style={{ height: '20px' }} alt="calendar icon" />,
                            }
                        }
                    />
                </LocalizationProvider>
            </Grid>
        </Grid>
    );
};

export default DateRange;
