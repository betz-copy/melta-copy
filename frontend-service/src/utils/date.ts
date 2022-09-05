export const getShortDate = (date: Date) => {
    return new Date(date).toLocaleString('en-uk', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};
