import { PropertyFormat, PropertyType } from '@packages/entity-template';
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
                type: PropertyType.string,
                title: 'שם הנהג',
                format: PropertyFormat.user,
            },
            tz: {
                type: PropertyType.string,
                title: 'ת.ז',
                pattern: '^\\d{9}$',
                patternCustomErrorMessage: 'ת.ז חייבת להכיל 9 ספרות',
            },
            bd: {
                type: PropertyType.string,
                title: 'תאריך לידה',
                format: PropertyFormat.date,
            },
            phone: {
                type: PropertyType.string,
                title: 'מס טלפון',
                pattern: '^(05\\d{1})-?\\d{7}$',
                patternCustomErrorMessage: 'מספר טלפון חייבת להכיל 10 ספרות',
            },
            glass: {
                type: PropertyType.boolean,
                title: 'מרכיב משקפיים',
            },
            type: {
                type: PropertyType.string,
                title: 'סוג נהג',
                enum: ['נוהג', 'נהג מקצועי'],
            },
            ID: {
                type: PropertyType.number,
                title: 'מ.א',
            },
            rank: {
                type: PropertyType.string,
                title: 'דרגה',
                enum: ['טוראי', 'רב"ט', 'סמל', 'סמ"ר', 'אעצ'],
            },
            service: {
                type: PropertyType.string,
                title: 'ס. שירות',
                enum: ['חובה', 'קבע', 'אע"ץ', 'יועץ'],
            },
            unit: {
                type: PropertyType.string,
                title: 'יחידה',
                enum: ['8200', '9900', '81', 'ספיר', 'תל"ם'],
            },
            gios_end: {
                type: PropertyType.string,
                title: 'תאריך שחרור',
                format: PropertyFormat.date,
                calculateTime: false,
            },
            tzion_ana: {
                type: PropertyType.number,
                title: 'ציון ענ"א',
            },
            manag_officer: {
                type: PropertyType.string,
                title: 'קצין בטיחות משויך',
                format: PropertyFormat.user,
            },
            why_manag_officer: {
                type: PropertyType.string,
                title: 'קצין רכב משויך',
                format: PropertyFormat.user,
            },
            license_status: {
                type: PropertyType.string,
                title: 'סטטוס רישיון',
                enum: ['ממתין לעיוני 1', 'ממתין לעיוני 2', 'ממתין לעיוני 3'],
            },
            army_license_issue: {
                type: PropertyType.string,
                title: 'תאריך הוצאת רישיון צבאי',
                format: PropertyFormat.date,
            },
            army_license_end: {
                type: PropertyType.string,
                title: 'תוקף רישיון צבאי',
                format: PropertyFormat.date,
            },
            license_issue: {
                type: PropertyType.string,
                title: 'תאריך הוצאת רישיון אזרחי',
                format: PropertyFormat.date,
            },
            license_end: {
                type: PropertyType.string,
                title: 'תוקף רישיון אזרחי',
                format: PropertyFormat.date,
            },
            initiation_process: {
                type: PropertyType.array,
                title: 'סוג תהליך חניכה',
                items: {
                    type: PropertyType.string,
                    enum: ['A', 'B', 'C'],
                },
                minItems: 1,
                uniqueItems: true,
            },
            Manual_transmission: {
                type: PropertyType.boolean,
                title: 'רשאי לנהוג על גיר ידני',
            },
            letter_on_necessity: {
                type: PropertyType.string,
                format: PropertyFormat.date,
                title: 'מכתב נחיצות)תראיך ביצוע ראיון מפקד ישיר(',
            },
            BBD_interview: {
                type: PropertyType.string,
                format: PropertyFormat.date,
                title: 'תאריך ביצוע ראיון קצין בב"ד',
            },
            More: {
                type: PropertyType.array,
                title: 'קבצים מקושרים',
                items: {
                    type: PropertyType.string,
                    format: PropertyFormat.fileId,
                },
                minItems: 1,
            },
            drivers_license: {
                type: PropertyType.string,
                format: PropertyFormat.fileId,
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
                type: PropertyType.string,
                title: 'מספר רכב אזרחי',
                pattern: '^\\d{2}-\\d{3}-\\d{2}$|^\\d{3}-\\d{2}-\\d{3}$',
                patternCustomErrorMessage: 'מספר רישוי שגוי',
            },
            base: {
                type: PropertyType.string,
                title: 'יחידה',
                enum: ['3060', 'ספיר', 'תל"ם'],
            },
            last_test: {
                type: PropertyType.string,
                title: 'תאריך טסט אחרון',
                format: PropertyFormat.date,
            },
            next_test: {
                type: PropertyType.string,
                title: 'תאריך יעד לטסט הבא',
                format: PropertyFormat.date,
            },
            parents: {
                type: PropertyType.string,
                title: 'בעלים',
                archive: false,
                format: PropertyFormat.relationshipReference,
                relationshipReference: {
                    relationshipTemplateDirection: 'outgoing',
                    relatedTemplateId: 'driver',
                    relatedTemplateField: 'full_name',
                },
            },
            is_ana: {
                type: PropertyType.boolean,
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
                type: PropertyType.string,
                title: 'נהג',
                archive: false,
                format: PropertyFormat.relationshipReference,
                relationshipReference: {
                    relationshipTemplateDirection: 'outgoing',
                    relatedTemplateId: 'driver',
                    relatedTemplateField: 'full_name',
                },
            },
            car: {
                type: PropertyType.string,
                title: 'רכב',
                archive: false,
                format: PropertyFormat.relationshipReference,
                relationshipReference: {
                    relationshipTemplateDirection: 'outgoing',
                    relatedTemplateId: 'car',
                    relatedTemplateField: 'ID',
                },
            },
            date: {
                type: PropertyType.string,
                title: 'תאריך התאונה',
                format: PropertyFormat['date-time'],
            },
            detail: {
                type: PropertyType.string,
                title: 'פירוט',
            },
            place: {
                type: PropertyType.string,
                title: 'מיקום',
            },
            mishpat: {
                type: PropertyType.string,
                title: 'תאריך משפט',
            },
            din: {
                type: PropertyType.string,
                title: 'גזר דין',
            },
        },
        hide: [],
    },
    propertiesOrder: ['driver', 'car', PropertyFormat.date, 'detail', 'place', 'mishpat', 'din'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    disabled: false,
};
