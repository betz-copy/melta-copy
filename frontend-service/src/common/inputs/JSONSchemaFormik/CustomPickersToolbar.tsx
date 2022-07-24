// custom mui date/dateTime picker's "PickersToolbar" component. bug in RTL mode.
// copied from: https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/internals/components/PickersToolbar.tsx
// see the RTL issue here: https://github.com/mui/mui-x/issues/5561
// also, old closed issue: https://github.com/mui/material-ui-pickers/issues/1071
import React from 'react';
import { styled } from '@mui/material';
import { BaseToolbarProps } from '@mui/x-date-pickers/internals/models/props/baseToolbarProps';
import { DateTimePickerTabs } from '@mui/x-date-pickers/DateTimePicker/DateTimePickerTabs';
import { PickersToolbar } from '@mui/x-date-pickers/internals/components/PickersToolbar';
import { PickersToolbarText } from '@mui/x-date-pickers/internals/components/PickersToolbarText';
import { PickersToolbarButton } from '@mui/x-date-pickers/internals/components/PickersToolbarButton';
import { useUtils } from '@mui/x-date-pickers/internals/hooks/useUtils';

const DateTimePickerToolbarRoot = styled(PickersToolbar)({
    paddingLeft: 16,
    paddingRight: 16,
    justifyContent: 'space-around',
    // [`& .${pickersToolbarClasses.penIconButton}`]: {
    '& .MuiIconButton-root': {
        position: 'absolute',
        top: 8,
        right: 8,
    },
});

const DateTimePickerToolbarDateContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const DateTimePickerToolbarTimeContainer = styled('div')({
    display: 'flex',
    flexDirection: 'row-reverse', // only line that is changed, support rtl!
});

const DateTimePickerToolbarSeparator = styled(PickersToolbarText)({
    margin: '0 4px 0 2px',
    cursor: 'default',
});

const CustomDateTimePickerToolbar: React.FC<BaseToolbarProps<Date | null>> = (props) => {
    const {
        ampm,
        date,
        dateRangeIcon,
        hideTabs,
        isMobileKeyboardViewOpen,
        onChange,
        openView,
        setOpenView,
        timeIcon,
        toggleMobileKeyboardView,
        toolbarFormat,
        toolbarPlaceholder = '––',
        toolbarTitle = 'Select date & time',
        views,
        ...other
    } = props;

    const utils = useUtils<Date | null>();

    const formatHours = (time: Date | null) => (ampm ? utils.format(time, 'hours12h') : utils.format(time, 'hours24h'));

    const dateText = React.useMemo(() => {
        if (!date) {
            return toolbarPlaceholder;
        }

        if (toolbarFormat) {
            return utils.formatByString(date, toolbarFormat);
        }

        return utils.format(date, 'shortDate');
    }, [date, toolbarFormat, toolbarPlaceholder, utils]);

    return (
        <>
            <DateTimePickerToolbarRoot
                toolbarTitle={toolbarTitle}
                isMobileKeyboardViewOpen={isMobileKeyboardViewOpen}
                toggleMobileKeyboardView={toggleMobileKeyboardView}
                {...other}
                isLandscape={false}
            >
                <DateTimePickerToolbarDateContainer>
                    {views.includes('year') && (
                        <PickersToolbarButton
                            tabIndex={-1}
                            variant="subtitle1"
                            data-mui-test="datetimepicker-toolbar-year"
                            onClick={() => setOpenView('year')}
                            selected={openView === 'year'}
                            value={date ? utils.format(date, 'year') : '–'}
                        />
                    )}
                    {views.includes('day') && (
                        <PickersToolbarButton
                            tabIndex={-1}
                            variant="h4"
                            data-mui-test="datetimepicker-toolbar-day"
                            onClick={() => setOpenView('day')}
                            selected={openView === 'day'}
                            value={dateText}
                        />
                    )}
                </DateTimePickerToolbarDateContainer>
                <DateTimePickerToolbarTimeContainer>
                    {views.includes('hours') && (
                        <PickersToolbarButton
                            variant="h3"
                            data-mui-test="hours"
                            onClick={() => setOpenView('hours')}
                            selected={openView === 'hours'}
                            value={date ? formatHours(date) : '--'}
                        />
                    )}
                    {views.includes('minutes') && (
                        <>
                            <DateTimePickerToolbarSeparator variant="h3" value=":" />
                            <PickersToolbarButton
                                variant="h3"
                                data-mui-test="minutes"
                                onClick={() => setOpenView('minutes')}
                                selected={openView === 'minutes'}
                                value={date ? utils.format(date, 'minutes') : '--'}
                            />
                        </>
                    )}
                    {views.includes('seconds') && (
                        <>
                            <DateTimePickerToolbarSeparator variant="h3" value=":" />
                            <PickersToolbarButton
                                variant="h3"
                                data-mui-test="seconds"
                                onClick={() => setOpenView('seconds')}
                                selected={openView === 'seconds'}
                                value={date ? utils.format(date, 'seconds') : '--'}
                            />
                        </>
                    )}
                </DateTimePickerToolbarTimeContainer>
            </DateTimePickerToolbarRoot>
            <DateTimePickerTabs dateRangeIcon={dateRangeIcon} timeIcon={timeIcon} view={openView} onChange={setOpenView} />
        </>
    );
};

export default CustomDateTimePickerToolbar;
