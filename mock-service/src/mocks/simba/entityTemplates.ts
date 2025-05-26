import { IEntityTemplateMock } from '../../templates/entityTemplates';

const entityTemplates: IEntityTemplateMock[] = [
    {
        name: 'driver',
        displayName: 'נהג',
        category: {
            name: 'main',
        },
        properties: {
            type: 'object',
            properties: {
                firstName: {
                    type: 'string',
                    title: 'שם פרטי',
                },
                lastName: {
                    type: 'string',
                    title: 'שם משפחה',
                },
                phone: {
                    type: 'string',
                    title: 'טלפון',
                },
                startDate: {
                    type: 'string',
                    title: 'תאריך התחלה',
                    format: 'date',
                },
                endDate: {
                    type: 'string',
                    title: 'תאריך סיום',
                    format: 'date',
                },
                licenseStatus: {
                    type: 'string',
                    title: 'רישיון',
                    enum: ['פעיל', 'לא פעיל', 'בתהליך'],
                },
                base: {
                    type: 'string',
                    title: 'בסיס',
                },
                id: {
                    type: 'string',
                    title: 'ת.ז',
                },
                mail: {
                    type: 'string',
                    title: 'דואר אלקטרוני',
                    format: 'email',
                },
            },
            hide: [],
        },
        propertiesOrder: ['firstName', 'lastName', 'phone', 'startDate', 'endDate', 'licenseStatus', 'base', 'id', 'mail'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['firstName', 'lastName', 'phone', 'startDate', 'endDate', 'licenseStatus', 'base', 'id', 'mail'],
        disabled: false,
    },
    {
        name: 'car',
        displayName: 'רכב',
        category: {
            name: 'main',
        },
        properties: {
            type: 'object',
            properties: {
                carNumber: {
                    type: 'string',
                    title: 'מספר רכב',
                },
                lastTestDate: {
                    type: 'string',
                    title: 'תאריך בדיקה אחרונה',
                    format: 'date',
                },
                nextTestDate: {
                    type: 'string',
                    title: 'תאריך בדיקה הבאה',
                    format: 'date',
                },
                status: {
                    type: 'string',
                    title: 'סטטוס',
                    enum: ['תקין', 'לא תקין'],
                },
                base: {
                    type: 'string',
                    title: 'בסיס',
                },
            },
            hide: [],
        },
        propertiesOrder: ['carNumber', 'lastTestDate', 'nextTestDate', 'status', 'base'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['carNumber', 'lastTestDate', 'nextTestDate', 'status', 'base'],
        disabled: false,
    },
];

export default entityTemplates;
