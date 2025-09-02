import { format } from 'date-fns';
import { environment } from '../globals';

const { date: dateFormat, time, fullTime } = environment.formats;

export const getShortDate = (date: Date) => {
    return format(new Date(date), [dateFormat, time].join(', '));
};
export const getLongDate = (date: Date) => {
    return format(new Date(date), [dateFormat, fullTime].join(', '));
};
export const getDateWithoutTime = (date: Date) => {
    return format(new Date(date), dateFormat);
};

export const dateBetween = (date: Date, startDate: Date, endDate: Date) => {
    return startDate.getTime() <= date.getTime() && date.getTime() <= endDate.getTime();
};

export const getDayStart = (date: Date) => {
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);
    return dateCopy;
};
export const getDayEnd = (date: Date) => {
    const dateCopy = new Date(date);
    dateCopy.setHours(23, 59, 59, 999);
    return dateCopy;
};
