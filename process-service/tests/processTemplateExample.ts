import { IProcessTemplate } from '../src/express/processTemplate/interface';

export const aTestProcessTemplate: Partial<IProcessTemplate> = {
    name: 'transaction',
    displayName: 'העברה',
    steps: [
        {
            name: 'money',
            displayName: 'כספים',
            properties: {
                type: 'object',
                properties: {
                    sum: {
                        type: 'number',
                        title: 'סכום',
                    },
                    currency: {
                        type: 'string',
                        title: 'מטבע',
                    },
                },
            },
            propertiesOrder: ['sum', 'currency'],
        },
        {
            name: 'confirmation',
            displayName: 'אישור',
            properties: {
                type: 'object',
                properties: {
                    sumConfirmation: {
                        type: 'boolean',
                        title: 'סכום מאושר?',
                    },
                    confirmationDescription: {
                        type: 'string',
                        title: 'הסבר אישור',
                    },
                },
            },
            propertiesOrder: ['sumConfirmation', 'confirmationDescription'],
        },
        {
            name: 'transferStatus',
            displayName: 'מצב העברה',
            properties: {
                type: 'object',
                properties: {
                    done: {
                        type: 'boolean',
                        title: 'בוצע?',
                    },
                },
            },
            propertiesOrder: ['done'],
        },
    ],
};

export const bTestProcessTemplate: Partial<IProcessTemplate> = {
    name: 'test',
    displayName: 'בדיקה',
    steps: [
        {
            name: 'money',
            displayName: 'כספים',
            properties: {
                type: 'object',
                properties: {
                    sum: {
                        type: 'number',
                        title: 'סכום',
                    },
                    currency: {
                        type: 'string',
                        title: 'מטבע',
                    },
                },
            },
            propertiesOrder: ['sum', 'currency'],
        },
    ],
};

// export const cTestProcessTemplate: IProcessTemplate = {};

// export const dTestProcessTemplate: IProcessTemplate = {};
