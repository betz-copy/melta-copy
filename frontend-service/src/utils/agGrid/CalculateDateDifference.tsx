import React, { useEffect, useState } from 'react';
import {
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    differenceInMonths,
    differenceInYears,
    intervalToDuration,
    isFuture,
    parse,
} from 'date-fns';
import i18next from 'i18next';

const calculateDifferences = (currentDateTime: Date, date: Date) => {
    return {
        diffInMinutes: Math.abs(differenceInMinutes(currentDateTime, date)),
        diffInHours: Math.abs(differenceInHours(currentDateTime, date)),
        diffInMonths: Math.abs(differenceInMonths(currentDateTime, date)),
        diffInDays: Math.abs(differenceInDays(currentDateTime, date)),
        diffInYears: Math.abs(differenceInYears(currentDateTime, date)),
    };
};

const CalculateDateDifference: React.FC<{ value: string }> = ({ value }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    const timeRegex = /\d{2}:\d{2}(:\d{2})?/;
    const isDateTime = timeRegex.test(value);
    const parsedDate = isDateTime ? parse(value, 'dd/MM/yyyy, HH:mm:ss', new Date()) : parse(value, 'dd/MM/yyyy', new Date());

    const { diffInMinutes, diffInHours, diffInDays } = calculateDifferences(currentDateTime, parsedDate);
    const { minutes, hours, years, months } = intervalToDuration({ start: currentDateTime, end: parsedDate });

    useEffect(() => {
        const intervalId = setTimeout(() => setCurrentDateTime(new Date()), 60000);
        return () => clearInterval(intervalId);
    }, [currentDateTime]);

    let displayValue = '';
    if (isDateTime && diffInMinutes <= 60) displayValue = `${minutes} ${i18next.t('agGridTimes.minutes')}`;
    else if (diffInHours < 24) displayValue = `${hours} ${i18next.t('agGridTimes.hours')} ${minutes} ${i18next.t('agGridTimes.minutes')}`;
    else if (diffInDays < 365) displayValue = `${months} ${i18next.t('agGridTimes.months')} ${diffInDays} ${i18next.t('agGridTimes.days')}`;
    else displayValue = `${years} ${i18next.t('agGridTimes.years')} ${months} ${i18next.t('agGridTimes.months')}`;

    return (
        <div>{`${
            isFuture(parse(value, 'dd/MM/yyyy', currentDateTime)) ? i18next.t('agGridTimes.future') : i18next.t('agGridTimes.ago')
        } ${displayValue}  (${value})
        
    `}</div>
    );
};

export { CalculateDateDifference };
