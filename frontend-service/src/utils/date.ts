import { format } from 'date-fns';

export const getShortDate = (date: Date) => {
    return format(new Date(date), 'dd/MM/yy, HH:mm');
};
export const getLongDate = (date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy, HH:mm:ss');
};
export const getDateWithoutTime = (date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
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
