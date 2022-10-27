export const getShortDate = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};
export const getLongDate = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
        timeZone: 'Israel',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};
export const getDateWithoutTime = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', { timeZone: 'Israel' });
};
