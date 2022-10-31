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
