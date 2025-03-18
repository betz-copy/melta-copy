import { Grid, MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import DateRange from '../DateRange';
import { StyledFilterInput } from './StyledFilterInput';
import { environment } from '../../../globals';

const { filterOptions } = environment;

interface DateFilterInputProps {
    filterField: IAGGridDateFilter | undefined;
    handleFilterTypeChange: (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
        condition?: boolean,
    ) => void;
    handleDateChange: (newValue: Date | null, isStartDate: boolean) => void;
    entityFilter: boolean;
    readOnly: boolean;
}

const DateFilterInput: React.FC<DateFilterInputProps> = ({ filterField, handleFilterTypeChange, handleDateChange, entityFilter, readOnly }) => {
    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                fullWidth
                select
                size="small"
                value={(filterField as IAGGridDateFilter).type || ''}
                inputProps={{
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                }}
                onChange={(e) =>
                    handleFilterTypeChange(e.target.value as IAGGridDateFilter['type'], Boolean((filterField as IAGGridDateFilter).dateFrom))
                }
                SelectProps={{
                    IconComponent: IoIosArrowDown,
                }}
                sx={{ mb: 4 }}
            >
                {filterOptions.number.map((option, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <MenuItem key={index} value={option}>
                        {i18next.t(`filters.${option}`)}
                    </MenuItem>
                ))}
            </StyledFilterInput>
            <DateRange
                onStartDateChange={(newValue) => handleDateChange(newValue, true)}
                onEndDateChange={(newValue) => handleDateChange(newValue, false)}
                startDateInput={filterField?.dateFrom ?? null}
                endDateInput={filterField?.dateTo ?? null}
                maxEndDate={new Date()}
                maxStartDate={new Date()}
                directionIsRow={entityFilter}
                overrideSx={{
                    '& input': {
                        backgroundColor: '#FFFF',
                    },
                    spacing: 0,
                }}
            />
        </Grid>
    );
};

export { DateFilterInput };
