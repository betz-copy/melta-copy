import React, { useEffect, useState } from 'react';
import { intervalToDuration, isFuture, isToday, isTomorrow, isYesterday, parse } from 'date-fns';
import i18next from 'i18next';
import { HighlightText } from '../HighlightText';
import { environment } from '../../globals';

const { date: dateFormat, time } = environment.formats;

const CalculateDateDifference: React.FC<{ date: string; searchValue?: string }> = ({ date, searchValue }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [showTimeIndicator, setShowTimeIndicator] = useState(true);
    const [startMinuteTimer, setStartMinuteTimer] = useState(false);

    const timeRegex = /\d{2}:\d{2}(:\d{2})?/;
    const isDateTime = timeRegex.test(date);
    const parsedDate = isDateTime ? parse(date, [dateFormat, time].join(', '), new Date()) : parse(date, dateFormat, new Date());

    const { minutes = 0, hours = 0, years = 0, months = 0, days = 0 } = intervalToDuration({ start: currentDateTime, end: parsedDate });

    useEffect(() => {
        const currentSecond = currentDateTime.getSeconds();
        const desiredSecond = parsedDate.getSeconds();
        const secondsUntilSecondOfDate = Math.abs(currentSecond - desiredSecond);

        const initialTimeoutId = setTimeout(() => {
            setCurrentDateTime(new Date());
            setStartMinuteTimer(true);
        }, secondsUntilSecondOfDate * 1000);

        return () => clearTimeout(initialTimeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (startMinuteTimer) {
            const intervalId = setInterval(() => {
                setCurrentDateTime(new Date());
            }, 60000);

            return () => clearInterval(intervalId);
        }
        return undefined;
    }, [startMinuteTimer]);

    useEffect(() => {
        if (!isDateTime && (isToday(parsedDate) || isTomorrow(parsedDate) || isYesterday(parsedDate))) {
            setShowTimeIndicator(false);
        }
    }, [parsedDate, isDateTime]);

    const displayValue = () => {
        switch (true) {
            case years > 0:
                return `${years} ${i18next.t('agGridTimes.years')} ${months} ${i18next.t('agGridTimes.months')}`;
            case months > 0:
                return `${months} ${i18next.t('agGridTimes.months')} ${days} ${i18next.t('agGridTimes.days')}`;
            case (isDateTime && days > 0) || (!isDateTime && days > 1):
                return `${days} ${i18next.t('agGridTimes.days')} ${isDateTime ? `${hours} ${i18next.t('agGridTimes.hours')}` : ''}`;
            case isDateTime && hours > 0:
                return `${hours} ${i18next.t('agGridTimes.hours')} ${minutes} ${i18next.t('agGridTimes.minutes')}`;
            case isDateTime && minutes >= 0:
                return `${minutes} ${i18next.t('agGridTimes.minutes')}`;
            case isToday(parsedDate):
                return i18next.t('agGridTimes.today');
            case isTomorrow(parsedDate):
                return i18next.t('agGridTimes.tomorrow');
            case isYesterday(parsedDate):
                return i18next.t('agGridTimes.yesterday');
            default:
                return '0';
        }
    };

    return (
        <>
            {showTimeIndicator && isFuture(parsedDate) && i18next.t('agGridTimes.future')}
            <HighlightText text={` ${displayValue()} (${date})`} searchedText={searchValue} />
        </>
    );
};

export { CalculateDateDifference };
