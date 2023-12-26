import React from 'react';
import { Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | null;
    endDateInput: Date | null;
}> = ({ onStartDateChange, onEndDateChange, startDateInput, endDateInput }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    return (
        <Grid container justifyContent="center" alignItems="center" wrap="nowrap">
            <Grid item>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        maxDate={endDateInput}
                        label={i18next.t('processInstancesPage.startDate')}
                        value={startDateInput}
                        onChange={(newStartDate) => onStartDateChange(newStartDate)}
                        renderInput={(params) => <TextField {...params} size="small" />}
                        InputProps={{
                            style: { backgroundColor: darkMode ? '#242424' : 'white', borderRadius: '0px 7px 7px 0px' },
                        }}
                    />
                </LocalizationProvider>
            </Grid>
            <Grid item className="processList-dateContainer">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        className="react-datepicker-wrapper"
                        minDate={startDateInput}
                        label={i18next.t('processInstancesPage.endDate')}
                        value={endDateInput}
                        onChange={(newEndDate) => onEndDateChange(newEndDate)}
                        renderInput={(params) => <TextField {...params} size="small" />}
                        InputProps={{
                            style: { backgroundColor: darkMode ? '#242424' : 'white', borderRadius: '7px 0px 0px 7px' },
                        }}
                    />
                </LocalizationProvider>
            </Grid>
        </Grid>
    );
};

export default DateRange;
