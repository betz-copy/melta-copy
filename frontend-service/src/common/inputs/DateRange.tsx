import React from 'react';
import { Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Divider from '@mui/material/Divider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import i18next from 'i18next';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | null;
    endDateInput: Date | null;
}> = ({ onStartDateChange, onEndDateChange, startDateInput, endDateInput }) => {
    return (
        <Grid
            container
            className="processList-datesRangeContainer"
            justifyContent="center"
            alignItems="center"
            wrap="nowrap"
            sx={{
                background: '#FFFFFF 0% 0% no-repeat padding-box',
                border: '1px solid #DBDBDB',
                borderRadius: '25px',
                opacity: '1',
                width: '32rem',
                height: '2.5em',
            }}
        >
            <Grid item className="processList-dateContainer">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        maxDate={endDateInput}
                        label={i18next.t('processInstancesPage.startDate')}
                        value={startDateInput}
                        onChange={(newStartDate) => onStartDateChange(newStartDate)}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
            </Grid>
            <Divider orientation="vertical" flexItem />
            <Grid item className="processList-dateContainer">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        className="react-datepicker-wrapper"
                        minDate={startDateInput}
                        label={i18next.t('processInstancesPage.endDate')}
                        value={endDateInput}
                        onChange={(newEndDate) => onEndDateChange(newEndDate)}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
            </Grid>
        </Grid>
    );
};

export default DateRange;
