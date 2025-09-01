import { ArrowDropDown as ArrowDropDownIcon, KeyboardArrowLeft as ArrowLeftIcon, KeyboardArrowRight as ArrowRightIcon } from '@mui/icons-material';
import { Button, Divider, Grid, Popover, Typography } from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ScheduleComponent, View } from '@syncfusion/ej2-react-schedule';
import { addMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import { getDateWithoutTime } from '../../utils/date';

interface IScheduleToolbar {
    scheduleRef: React.RefObject<ScheduleComponent | null>;
    darkMode: boolean;
}

export const ScheduleToolbar: React.FC<IScheduleToolbar> = ({ scheduleRef, darkMode }) => {
    const datePickerButtonRef = useRef<HTMLButtonElement>(null);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    if (!scheduleRef.current) return null;
    const { selectedDate, viewCollections, currentView } = scheduleRef.current;

    const textColor = darkMode ? '#FFFFFF' : '#000000';

    const moveDate = (offset: number, view: View) => {
        const newDate = new Date(selectedDate);

        switch (view) {
            case 'Year':
            case 'TimelineYear':
                newDate.setFullYear(newDate.getFullYear() + offset);
                break;

            case 'Month':
            case 'TimelineMonth':
                newDate.setTime(addMonths(newDate, offset).getTime());
                break;

            case 'Week':
            case 'TimelineWeek':
            case 'WorkWeek':
            case 'TimelineWorkWeek':
                newDate.setDate(newDate.getDate() + offset * 7);
                break;

            case 'Day':
            case 'TimelineDay':
                newDate.setDate(newDate.getDate() + offset);
                break;

            default:
                throw new Error(`Unsupported view: ${view}`);
        }

        scheduleRef.current?.changeDate(newDate);
    };

    return (
        <Grid
            container
            justifyContent="space-between"
            wrap="nowrap"
            height="3rem"
            bgcolor={darkMode ? '#171717' : '#fafafa'}
            borderBottom={`solid 1px ${darkMode ? '#404040' : 'lightgray'}`}
        >
            <Grid container>
                <Button onClick={() => moveDate(-1, currentView)} sx={{ color: textColor }}>
                    <ArrowRightIcon />
                </Button>
                <Button onClick={() => moveDate(1, currentView)} sx={{ color: textColor }}>
                    <ArrowLeftIcon />
                </Button>

                <Divider orientation="vertical" flexItem />

                <Button ref={datePickerButtonRef} onClick={() => setDatePickerOpen(true)} sx={{ color: textColor }}>
                    <Grid container wrap="nowrap" alignItems="center">
                        <Typography>{getDateWithoutTime(selectedDate)}</Typography>
                        <ArrowDropDownIcon />
                    </Grid>
                </Button>
                <Popover
                    open={datePickerOpen}
                    anchorEl={datePickerButtonRef.current}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    onClose={() => setDatePickerOpen(false)}
                    sx={{ direction: 'ltr' }}
                >
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                        <StaticDatePicker
                            value={selectedDate}
                            onChange={(newDate) => {
                                if (!newDate) return;

                                scheduleRef.current?.changeDate(newDate);
                                setDatePickerOpen(false);
                            }}
                            slots={{ actionBar: () => null }}
                            displayStaticWrapperAs="desktop"
                            views={['day']}
                        />
                    </LocalizationProvider>
                </Popover>
            </Grid>

            <Grid container wrap="nowrap" justifyContent="flex-end">
                <Button
                    onClick={() => scheduleRef.current?.changeDate(new Date())}
                    sx={{ color: getDateWithoutTime(selectedDate) === getDateWithoutTime(new Date()) ? '#225AA7' : textColor }}
                >
                    {i18next.t('schedule.schedule.today')}
                </Button>

                <Divider orientation="vertical" flexItem />

                {viewCollections.map(
                    ({ option }) =>
                        option && (
                            <Button
                                key={option}
                                onClick={() => scheduleRef.current?.changeView(option)}
                                sx={{ color: currentView === option ? '#225AA7' : textColor }}
                            >
                                {i18next.t(`schedule.views.${option}`)}
                            </Button>
                        ),
                )}
            </Grid>
        </Grid>
    );
};
