import React from 'react';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import DatePickerWrapper from './DatePickerWrapper';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | null;
    endDateInput: Date | null;
    directionIsRow: boolean;
    overrideSx?: object;
}> = ({ onStartDateChange, onEndDateChange, startDateInput, endDateInput, overrideSx, directionIsRow }) => {
    // const darkMode = useSelector((state: RootState) => state.darkMode);
    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            wrap="nowrap"
            spacing={overrideSx ? 2 : 0}
            display="flex"
            flexDirection={directionIsRow ? 'row' : 'column'}
        >
            <Grid item style={{ paddingBottom: !directionIsRow ? '10px' : '0px' }}>
                <DatePickerWrapper
                    label={i18next.t('processInstancesPage.startDate')}
                    value={startDateInput}
                    onChange={onStartDateChange}
                    maxDate={endDateInput ?? new Date()}
                    minDate={undefined}
                    sx={overrideSx}
                    components={
                        overrideSx && {
                            // eslint-disable-next-line react/no-unstable-nested-components
                            OpenPickerIcon: () => <img src="/icons/calendar.svg" style={{ height: '20px' }} alt="calendar icon" />,
                        }
                    }
                    isStartDate
                    directionIsRow={directionIsRow}
                />
            </Grid>
            <Grid item className="processList-dateContainer">
                <DatePickerWrapper
                    label={i18next.t('processInstancesPage.endDate')}
                    value={endDateInput}
                    onChange={onEndDateChange}
                    maxDate={new Date()}
                    minDate={startDateInput}
                    sx={overrideSx}
                    components={
                        overrideSx && {
                            // eslint-disable-next-line react/no-unstable-nested-components
                            OpenPickerIcon: () => <img src="/icons/calendar.svg" style={{ height: '20px' }} alt="calendar icon" />,
                        }
                    }
                    directionIsRow={directionIsRow}
                />
            </Grid>
        </Grid>
    );
};

export default DateRange;
