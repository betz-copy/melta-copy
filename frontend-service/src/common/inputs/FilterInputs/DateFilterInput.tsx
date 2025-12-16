import {
    ByCurrentDefaultValue,
    basicFilterOperationTypes,
    filterTypes,
    IAgGridDateFilter,
    IAgGridNumberFilter,
    IAgGridTextFilter,
    numberFilterOperationTypes,
    relativeDateFilters,
} from '@microservices/shared';
import { FormControlLabel, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { useDarkModeStore } from '../../../stores/darkMode';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import DatePickerWrapper from '../DatePickerWrapper';
import DateRange from '../DateRange';
import { TypeSelectFilter } from './TypeSelectFilter';

interface DateFilterInputProps {
    filterField: IAgGridDateFilter | undefined;
    handleFilterTypeChange: (
        newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type'],
        condition?: boolean,
    ) => void;
    handleDateChange: (newValue: Date | ByCurrentDefaultValue.byCurrentDate | relativeDateFilters | null, isStartDate: boolean) => void;
    entityFilter: boolean;
    readOnly?: boolean;
    hideFilterType?: boolean;
    forceEqualsType?: boolean;
    currentDateCheckbox?: boolean;
}

const DateFilterInput: React.FC<DateFilterInputProps> = ({
    filterField,
    handleFilterTypeChange,
    handleDateChange,
    entityFilter,
    readOnly,
    hideFilterType = false,
    forceEqualsType = false,
    currentDateCheckbox = false,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const isInRangeType = filterField?.type === numberFilterOperationTypes.inRange;
    const isRelativeType = Object.values(relativeDateFilters).includes((filterField?.type ?? '') as relativeDateFilters);

    useEffect(() => {
        if (forceEqualsType && filterField && filterField.type !== basicFilterOperationTypes.equals) {
            handleFilterTypeChange(basicFilterOperationTypes.equals);
        }
    }, [forceEqualsType, filterField]);

    useEffect(() => {
        if (!filterField) return;
        const { type, dateFrom, dateTo } = filterField;

        if (isRelativeType) {
            handleDateChange(type as relativeDateFilters, true);
            return;
        }

        if (
            (dateFrom && Object.values(relativeDateFilters).includes(dateFrom as relativeDateFilters)) ||
            (dateTo && Object.values(relativeDateFilters).includes(dateTo as relativeDateFilters))
        ) {
            handleDateChange(null, true);
            handleDateChange(null, false);
            return;
        }

        if (type !== numberFilterOperationTypes.inRange && dateTo !== null) {
            handleDateChange(null, false);
            return;
        }
    }, [filterField?.type]);

    const inputStyle = darkMode
        ? undefined
        : {
              '& input': { backgroundColor: '#FFFF', fontSize: '14px' },
              spacing: 0,
          };

    return (
        <Grid container flexDirection={'column'} spacing={0.5}>
            <Grid
                container
                justifyContent="start"
                direction={isInRangeType || !entityFilter ? 'column' : 'row'}
                spacing={1}
                sx={{
                    boxSizing: 'content-box',
                    height: 'fit-content',
                    display: 'flex',
                    flexDirection: isInRangeType ? 'column' : 'row',
                    flexWrap: 'nowrap',
                }}
            >
                {!hideFilterType && (
                    <Grid size={{ xs: isInRangeType || isRelativeType ? 12 : 5 }}>
                        <TypeSelectFilter
                            filterField={filterField as IAgGridDateFilter}
                            handleFilterTypeChange={handleFilterTypeChange}
                            readOnly={readOnly || forceEqualsType}
                            type={filterTypes.date}
                        />
                    </Grid>
                )}
                {!isRelativeType && (
                    <Grid
                        size={{ xs: hideFilterType || isInRangeType ? 12 : 7 }}
                        sx={{ width: isInRangeType ? '100%' : 'auto', mt: isInRangeType ? '0.5em' : 0 }}
                        boxSizing="border-box"
                        width="86%"
                    >
                        {isInRangeType && !forceEqualsType ? (
                            <DateRange
                                onStartDateChange={(newValue) => handleDateChange(newValue, true)}
                                onEndDateChange={(newValue) => handleDateChange(newValue, false)}
                                startDateInput={filterField?.dateFrom ?? null}
                                endDateInput={filterField?.dateTo ?? null}
                                directionIsRow={true}
                                overrideSx={inputStyle}
                                readOnly={readOnly || filterField?.dateFrom === ByCurrentDefaultValue.byCurrentDate}
                            />
                        ) : (
                            <DatePickerWrapper
                                value={filterField?.dateFrom}
                                onChange={(newValue) => handleDateChange(newValue, true)}
                                sx={inputStyle}
                                isStartDate
                                directionIsRow={false}
                                readOnly={readOnly || filterField?.dateFrom === ByCurrentDefaultValue.byCurrentDate}
                                disableKeyboardInput
                            />
                        )}
                    </Grid>
                )}
            </Grid>
            {currentDateCheckbox && (
                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <MeltaCheckbox
                                checked={filterField?.dateFrom === ByCurrentDefaultValue.byCurrentDate}
                                onChange={(e) => {
                                    if (e.target.checked) handleDateChange(ByCurrentDefaultValue.byCurrentDate, true);
                                    else handleDateChange(null, true);
                                }}
                                sx={{ marginLeft: 0.5 }}
                            />
                        }
                        label={i18next.t('childTemplate.currentDate')}
                        slotProps={{
                            typography: { sx: { fontSize: '14px' } },
                        }}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { DateFilterInput };
