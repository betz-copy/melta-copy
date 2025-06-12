import { IEntityTemplateMock } from '../../templates/entityTemplates';

export const driverEntityTemplate: IEntityTemplateMock = {
    name: 'driver',
    displayName: 'נהג',
    category: {
        name: 'main',
    },
    properties: {
        type: 'object',
        properties: {
            full_name: {
                type: 'string',
                title: 'שם הנהג',
                format: 'user',
            },
            tz: {
                type: 'string',
                title: 'ת.ז',
                pattern: '^\\d{9}$',
                patternCustomErrorMessage: 'ת.ז חייבת להכיל 9 ספרות',
            },
            bd: {
                type: 'string',
                title: 'תאריך לידה',
                format: 'date',
            },
            phone: {
                type: 'string',
                title: 'מס טלפון',
                pattern: '^(05\\d{1})-?\\d{7}$',
                patternCustomErrorMessage: 'מספר טלפון חייבת להכיל 10 ספרות',
            },
            glass: {
                type: 'boolean',
                title: 'מרכיב משקפיים',
            },
            type: {
                type: 'string',
                title: 'סוג נהג',
                enum: ['נוהג', 'נהג מקצועי'],
            },
            ID: {
                type: 'number',
                title: 'מ.א',
            },
            rank: {
                type: 'string',
                title: 'דרגה',
                enum: ['טוראי', 'רב"ט', 'סמל', 'סמ"ר', 'אעצ'],
            },
            service: {
                type: 'string',
                title: 'ס. שירות',
                enum: ['חובה', 'קבע', 'אע"ץ', 'יועץ'],
            },
            unit: {
                type: 'string',
                title: 'יחידה',
                enum: ['8200', '9900', '81', 'ספיר', 'תל"ם'],
            },
            gios_end: {
                type: 'string',
                title: 'תאריך שחרור',
                format: 'date',
                calculateTime: false,
            },
            tzion_ana: {
                type: 'number',
                title: 'ציון ענ"א',
            },
            manag_officer: {
                type: 'string',
                title: 'קצין בטיחות משויך',
                format: 'user',
            },
            why_manag_officer: {
                type: 'string',
                title: 'קצין רכב משויך',
                format: 'user',
            },
            license_status: {
                type: 'string',
                title: 'סטטוס רישיון',
                enum: ['ממתין לעיוני 1', 'ממתין לעיוני 2', 'ממתין לעיוני 3'],
            },
            army_license_issue: {
                type: 'string',
                title: 'תאריך הוצאת רישיון צבאי',
                format: 'date',
            },
            army_license_end: {
                type: 'string',
                title: 'תוקף רישיון צבאי',
                format: 'date',
            },
            license_issue: {
                type: 'string',
                title: 'תאריך הוצאת רישיון אזרחי',
                format: 'date',
            },
            license_end: {
                type: 'string',
                title: 'תוקף רישיון אזרחי',
                format: 'date',
            },
            initiation_process: {
                type: 'array',
                title: 'סוג תהליך חניכה',
                items: {
                    type: 'string',
                    enum: ['A', 'B', 'C'],
                },
                minItems: 1,
                uniqueItems: true,
            },
            Manual_transmission: {
                type: 'boolean',
                title: 'רשאי לנהוג על גיר ידני',
            },
            letter_on_necessity: {
                type: 'string',
                format: 'date',
                title: 'מכתב נחיצות)תראיך ביצוע ראיון מפקד ישיר(',
            },
            BBD_interview: {
                type: 'string',
                format: 'date',
                title: 'תאריך ביצוע ראיון קצין בב"ד',
            },
            More: {
                type: 'array',
                title: 'קבצים מקושרים',
                items: {
                    type: 'string',
                    format: 'fileId',
                },
                minItems: 1,
            },
            drivers_license: {
                type: 'string',
                format: 'fileId',
                title: 'תצלום רשיון נהיגה אזרחי',
            },
        },
        hide: [],
    },
    propertiesOrder: [
        'full_name',
        'tz',
        'bd',
        'phone',
        'glass',
        'type',
        'ID',
        'rank',
        'service',
        'unit',
        'gios_end',
        'tzion_ana',
        'manag_officer',
        'why_manag_officer',
        'license_status',
        'army_license_issue',
        'army_license_end',
        'license_issue',
        'license_end',
        'initiation_process',
        'Manual_transmission',
        'letter_on_necessity',
        'BBD_interview',
        'More',
        'drivers_license',
    ],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: ['full_name', 'phone', 'ID'],
    disabled: false,
};

export const carEntityTemplate: IEntityTemplateMock = {
    name: 'car',
    displayName: 'רכב',
    category: {
        name: 'main',
    },
    properties: {
        type: 'object',
        properties: {
            ID: {
                type: 'string',
                title: 'מספר רכב אזרחי',
                pattern: '^\\d{2}-\\d{3}-\\d{2}$|^\\d{3}-\\d{2}-\\d{3}$',
                patternCustomErrorMessage: 'מספר רישוי שגוי',
            },
            base: {
                type: 'string',
                title: 'יחידה',
                enum: ['3060', 'ספיר', 'תל"ם'],
            },
            last_test: {
                type: 'string',
                title: 'תאריך טסט אחרון',
                format: 'date',
            },
            next_test: {
                type: 'string',
                title: 'תאריך יעד לטסט הבא',
                format: 'date',
            },
            parents: {
                type: 'string',
                title: 'בעלים',
                archive: false,
                format: 'relationshipReference',
                relationshipReference: {
                    relationshipTemplateDirection: 'outgoing',
                    relatedTemplateId: 'driver',
                    relatedTemplateField: 'full_name',
                },
            },
            is_ana: {
                type: 'boolean',
                title: 'ענ"א',
                archive: false,
            },
        },
        hide: [],
    },
    propertiesOrder: ['ID', 'base', 'last_test', 'next_test', 'parents', 'is_ana'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    disabled: false,
};

export const crashEntityTemplate: IEntityTemplateMock = {
    name: 'crash',
    displayName: 'דיווחי תאונות',
    category: {
        name: 'main',
    },
    properties: {
        type: 'object',
        properties: {
            driver: {
                type: 'string',
                title: 'נהג',
                archive: false,
                format: 'relationshipReference',
                relationshipReference: {
                    relationshipTemplateDirection: 'outgoing',
                    relatedTemplateId: 'driver',
                    relatedTemplateField: 'full_name',
                },
            },
            car: {
                type: 'string',
                title: 'רכב',
                archive: false,
                format: 'relationshipReference',
                relationshipReference: {
                    relationshipTemplateDirection: 'outgoing',
                    relatedTemplateId: 'car',
                    relatedTemplateField: 'ID',
                },
            },
            date: {
                type: 'string',
                title: 'תאריך התאונה',
                format: 'date-time',
            },
            detail: {
                type: 'string',
                title: 'פירוט',
            },
            place: {
                type: 'string',
                title: 'מיקום',
            },
            mishpat: {
                type: 'string',
                title: 'תאריך משפט',
            },
            din: {
                type: 'string',
                title: 'גזר דין',
            },
        },
        hide: [],
    },
    propertiesOrder: ['driver', 'car', 'date', 'detail', 'place', 'mishpat', 'din'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    disabled: false,
};
