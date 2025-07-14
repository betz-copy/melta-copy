import { CalendarToday } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';
import { useDarkModeStore } from '../../../stores/darkMode';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import DatePickerWrapper from '../DatePickerWrapper';
import DateRange from '../DateRange';
import { TypeSelectFilter } from './TypeSelectFilter';

interface DateFilterInputProps {
    filterField: IAGGridDateFilter | undefined;
    handleFilterTypeChange: (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
        condition?: boolean,
    ) => void;
    handleDateChange: (newValue: Date | null, isStartDate: boolean) => void;
    entityFilter: boolean;
    readOnly?: boolean;
}

const DateFilterInput: React.FC<DateFilterInputProps> = ({ filterField, handleFilterTypeChange, handleDateChange, entityFilter, readOnly }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const isInRangeType = filterField?.type === 'inRange';

    const inputStyle = darkMode
        ? undefined
        : {
              '& input': { backgroundColor: '#FFFF', fontSize: '14px' },
              spacing: 0,
          };

    return (
        <Grid
            container
            justifyContent="start"
            direction={isInRangeType || !entityFilter ? 'column' : 'row'}
            spacing={1}
            sx={{ boxSizing: 'content-box', height: 'fit-content', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' }}
        >
            <Grid item xs={isInRangeType ? 12 : 5}>
                <TypeSelectFilter
                    filterField={filterField as IAGGridDateFilter}
                    handleFilterTypeChange={handleFilterTypeChange}
                    readOnly={readOnly}
                    type="date"
                />
            </Grid>

            <Grid item xs={isInRangeType ? 12 : 7} boxSizing="border-box" width="86%">
                {isInRangeType ? (
                    <DateRange
                        onStartDateChange={(newValue) => handleDateChange(newValue, true)}
                        onEndDateChange={(newValue) => handleDateChange(newValue, false)}
                        startDateInput={filterField?.dateFrom ?? null}
                        endDateInput={filterField?.dateTo ?? null}
                        directionIsRow={entityFilter}
                        overrideSx={inputStyle}
                        readOnly={readOnly}               
                    />
                ) : (
                    <DatePickerWrapper
                        value={filterField?.dateFrom}
                        onChange={(newValue) => handleDateChange(newValue, true)}
                        components={{
                            // eslint-disable-next-line react/no-unstable-nested-components
                            OpenPickerIcon: () => <CalendarToday color="primary" fontSize="small" />,
                        }}
                        sx={inputStyle}
                        isStartDate
                        directionIsRow={false}
                        readOnly={readOnly}
                    />
                )}
            </Grid>
        </Grid>
    );
};

export { DateFilterInput };
