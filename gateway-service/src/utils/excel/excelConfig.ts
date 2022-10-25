export const excelConfig = {
    defaultFilterParams: {
        filterModel: {},
        sortModel: [],
    },
    excelDefaultColumns: [
        { key: 'disabled', header: '?מושבת', width: 20 },
        { key: 'createdAt', header: 'תאריך יצירה', width: 20 },
        { key: 'updatedAt', header: 'תאריך עדכון', width: 20 },
    ],
    TRUE_TO_HEBREW: 'כן',
    FALSE_TO_HEBREW: 'לא',
    DATE_TIMEZONE: 'Israel',
    DATE_LOCALES: 'en-UK',
    regexOfDateFormat: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/,
};
