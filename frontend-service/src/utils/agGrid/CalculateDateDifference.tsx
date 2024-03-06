import React, { useEffect, useState } from 'react';
import { intervalToDuration, isFuture, isToday, isTomorrow, isYesterday, parse } from 'date-fns';
import i18next from 'i18next';

const CalculateDateDifference: React.FC<{ date: string }> = ({ date }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [viewIndicateTime, setViewIndicateTime] = useState(true);

    const timeRegex = /\d{2}:\d{2}(:\d{2})?/;
    const isDateTime = timeRegex.test(date);
    const parsedDate = isDateTime ? parse(date, 'dd/MM/yyyy, HH:mm:ss', new Date()) : parse(date, 'dd/MM/yyyy', new Date());

    const { minutes = 0, hours = 0, years = 0, months = 0, days = 0 } = intervalToDuration({ start: currentDateTime, end: parsedDate });

    useEffect(() => {
        const delayUntilNextMinute = 60000 - new Date().getSeconds() * 1000;
        const initialTimeoutId = setTimeout(() => {
            setCurrentDateTime(new Date());
            const intervalId = setInterval(() => {
                setCurrentDateTime(new Date());
            }, 60000);

            return () => clearInterval(intervalId);
        }, delayUntilNextMinute);

        return () => clearTimeout(initialTimeoutId);
    }, []);

    useEffect(() => {
        if (!isDateTime && (isToday(parsedDate) || isTomorrow(parsedDate) || isYesterday(parsedDate))) {
            setViewIndicateTime(false);
        }
    }, [parsedDate, isDateTime]);

    let displayValue = '';
    switch (true) {
        case years > 0:
            displayValue = `${years} ${i18next.t('agGridTimes.years')} ${months} ${i18next.t('agGridTimes.months')}`;
            break;
        case months > 0:
            displayValue = `${months} ${i18next.t('agGridTimes.months')} ${days} ${i18next.t('agGridTimes.days')}`;
            break;
        case (isDateTime && days > 0) || (!isDateTime && days > 1):
            displayValue = `${days} ${i18next.t('agGridTimes.days')} ${isDateTime ? `${hours} ${i18next.t('agGridTimes.hours')}` : ''}`;
            break;
        case isDateTime && hours > 0:
            displayValue = `${hours} ${i18next.t('agGridTimes.hours')} ${minutes} ${i18next.t('agGridTimes.minutes')}`;
            break;
        case isDateTime && minutes >= 0:
            displayValue = `${minutes} ${i18next.t('agGridTimes.minutes')}`;
            break;
        case isToday(parsedDate):
            displayValue = i18next.t('agGridTimes.today');
            break;
        case isTomorrow(parsedDate):
            displayValue = i18next.t('agGridTimes.tomorrow');
            break;
        case isYesterday(parsedDate):
            displayValue = i18next.t('agGridTimes.yesterday');
            break;
        default:
            displayValue = '0';
    }

    return (
        <div>
            {viewIndicateTime && (isFuture(parsedDate) ? i18next.t('agGridTimes.future') : i18next.t('agGridTimes.ago'))}
            {` ${displayValue} (${date})`}
        </div>
    );
};

export { CalculateDateDifference };
