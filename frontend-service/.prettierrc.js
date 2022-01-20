module.exports = {
    printWidth: 80,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 150,
    tabWidth: 4,
    endOfLine: 'auto',
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.yml',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
