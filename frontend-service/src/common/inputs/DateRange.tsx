import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import DatePickerWrapper from './DatePickerWrapper';

const DateRange: React.FC<{
    onStartDateChange: (newStartDateInput: Date | null) => void;
    onEndDateChange: (newEndDateInput: Date | null) => void;
    startDateInput: Date | string | null;
    endDateInput: Date | string | null;
    directionIsRow: boolean;
    overrideSx?: object;
    maxEndDate?: Date;
    maxStartDate?: Date;
    readOnly?: boolean;
    borderRadius?: string;
}> = ({
    onStartDateChange,
    onEndDateChange,
    startDateInput,
    endDateInput,
    overrideSx,
    directionIsRow,
    maxEndDate,
    maxStartDate,
    readOnly = false,
    borderRadius,
}) => {
    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            wrap="nowrap"
            // eslint-disable-next-line no-nested-ternary
            spacing={overrideSx && 'spacing' in overrideSx ? (overrideSx.spacing as number) : overrideSx ? 2 : 0}
            display="flex"
            flexDirection={directionIsRow ? 'row' : 'column'}
        >
            <Grid style={{ paddingBottom: !directionIsRow ? '10px' : '0px' }}>
                <DatePickerWrapper
                    label={i18next.t('processInstancesPage.startDate')}
                    value={startDateInput}
                    onChange={onStartDateChange}
                    maxDate={endDateInput ?? maxStartDate}
                    sx={overrideSx}
                    isStartDate
                    directionIsRow={directionIsRow}
                    readOnly={readOnly}
                    borderRadius={borderRadius}
                />
            </Grid>
            <Grid className="processList-dateContainer">
                <DatePickerWrapper
                    label={i18next.t('processInstancesPage.endDate')}
                    value={endDateInput}
                    onChange={onEndDateChange}
                    maxDate={maxEndDate}
                    minDate={startDateInput}
                    sx={overrideSx}
                    directionIsRow={directionIsRow}
                    readOnly={readOnly}
                    borderRadius={borderRadius}
                />
            </Grid>
        </Grid>
    );
};

export default DateRange;
