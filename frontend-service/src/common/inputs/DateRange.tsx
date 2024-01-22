import React from 'react';
import { Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import i18next from 'i18next';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | null;
    endDateInput: Date | null;
    overrideSx?: object;
}> = ({ onStartDateChange, onEndDateChange, startDateInput, endDateInput, overrideSx }) => {
    // const darkMode = useSelector((state: RootState) => state.darkMode);
    return (
        <Grid container justifyContent="center" alignItems="center" wrap="nowrap" boxShadow={overrideSx && '0 0 10px rgba(0, 0, 0, 0.2)'}>
            <Grid item>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        inputFormat="dd/MM/yyyy"
                        maxDate={endDateInput}
                        label={i18next.t('processInstancesPage.startDate')}
                        value={startDateInput}
                        onChange={(newStartDate) => onStartDateChange(newStartDate)}
                        renderInput={(params) => <TextField {...params} size="small" sx={overrideSx} />}
                        InputProps={{
                            style: { borderRadius: '0px 7px 7px 0px', backgroundColor: overrideSx && 'white' },

                            // TODO - implement dark mode when it will be supported
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
                        renderInput={(params) => <TextField {...params} size="small" sx={overrideSx} />}
                        InputProps={{
                            style: { borderRadius: '7px 0px 0px 7px', backgroundColor: overrideSx && 'white' },
                        }}
                    />
                </LocalizationProvider>
            </Grid>
        </Grid>
    );
};

export default DateRange;
