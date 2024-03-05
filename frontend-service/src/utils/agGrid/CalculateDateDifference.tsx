import React, { useEffect, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInYears, isFuture, parse } from 'date-fns';
import i18next from 'i18next';

const parseDate = (value: string) => {
    const timeRegex = /\d{2}:\d{2}(:\d{2})?/;
    const isDateTime = timeRegex.test(value);
    return isDateTime ? parse(value, 'dd/MM/yyyy, HH:mm:ss', new Date()) : parse(value, 'dd/MM/yyyy', new Date());
};

const calculateDifferences = (currentDateTime: Date, date: Date) => {
    return {
        diffInMinutes: Math.abs(differenceInMinutes(currentDateTime, date)),
        diffInHours: Math.abs(differenceInHours(currentDateTime, date)),
        diffInDays: Math.abs(differenceInDays(currentDateTime, date)),
        diffInYears: Math.abs(differenceInYears(currentDateTime, date)),
    };
};

const CalculateDateDifference: React.FC<{ value: string }> = ({ value }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const timeRegex = /\d{2}:\d{2}(:\d{2})?/;
    const isDateTime = timeRegex.test(value);
    const parsedDate = isDateTime ? parse(value, 'dd/MM/yyyy, HH:mm:ss', new Date()) : parse(value, 'dd/MM/yyyy', new Date());

    const { diffInMinutes, diffInHours, diffInDays, diffInYears } = calculateDifferences(currentDateTime, parsedDate);

    useEffect(() => {
        let interval = 60000;
        if (diffInMinutes > 60) interval = 3600000;

        if (diffInHours > 24) interval = 86400000;

        if (diffInDays > 365) interval = 31536000000;

        const intervalId = setTimeout(() => setCurrentDateTime(new Date()), interval);

        return () => clearTimeout(intervalId);
    }, [currentDateTime]);

    let displayValue = '';
    if (isDateTime && diffInMinutes <= 60) displayValue = `${diffInMinutes} ${i18next.t('agGridTimes.minutes')}`;
    else if (diffInHours < 24) displayValue = `${diffInHours} ${i18next.t('agGridTimes.hours')}`;
    else if (diffInDays < 365) displayValue = `${diffInDays} ${i18next.t('agGridTimes.days')}`;
    else displayValue = `${diffInYears} ${i18next.t('agGridTimes.years')}`;

    return (
        <div>{`${
            isFuture(parse(value, 'dd/MM/yyyy', currentDateTime)) ? i18next.t('agGridTimes.future') : i18next.t('agGridTimes.ago')
        } ${displayValue}  (${value})
        
    `}</div>
    );
};

export { CalculateDateDifference };
