import { CalendarToday } from '@mui/icons-material';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import DatePickerWrapper from './DatePickerWrapper';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | null;
    endDateInput: Date | null;
    directionIsRow: boolean;
    overrideSx?: object;
}> = ({ onStartDateChange, onEndDateChange, startDateInput, endDateInput, overrideSx, directionIsRow }) => {
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
                            OpenPickerIcon: () => <CalendarToday color="primary" fontSize="small" />,
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
                            OpenPickerIcon: () => <CalendarToday color="primary" fontSize="small" />,
                        }
                    }
                    directionIsRow={directionIsRow}
                />
            </Grid>
        </Grid>
    );
};

export default DateRange;
