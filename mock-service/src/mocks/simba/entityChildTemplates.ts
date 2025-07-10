import { IEntityChildTemplate, ViewType } from '@microservices/shared';

const driverEntityChildTemplate: IEntityChildTemplate = {
    name: 'driver_view',
    displayName: 'נהג_פרטי הנוהג',
    description: 'פרטי הנוהג',
    fatherTemplateId: '683829d2657d1b63a9f4f25b',
    categories: ['683829d2657d1b63a9f4f257'],
    properties: {
        tz: {
            title: 'ת.ז',
            type: 'string',
            isEditableByUser: false,
        },
        bd: {
            title: 'תאריך לידה',
            type: 'string',
            format: 'date',
            isEditableByUser: false,
        },
        phone: {
            title: 'מס טלפון',
            type: 'string',
            isEditableByUser: false,
        },
        unit: {
            title: 'יחידה',
            type: 'string',
            isEditableByUser: false,
        },
        gios_end: {
            title: 'תאריך שחרור',
            type: 'string',
            format: 'date',
            isEditableByUser: false,
        },
        license_status: {
            title: 'סטטוס רישיון',
            type: 'string',
            isEditableByUser: false,
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: true,
    isFilterByUserUnit: false,
    filterByCurrentUserField: 'full_name',
};

const carEntityChildTemplate: IEntityChildTemplate = {
    name: 'car_view',
    displayName: 'רכב_פרטי רכב',
    description: 'פרטי רכב',
    fatherTemplateId: '683829d2657d1b63a9f4f26e',
    categories: ['683829d2657d1b63a9f4f257'],
    properties: {
        ID: {
            title: 'מספר רכב אזרחי',
            type: 'string',
            isEditableByUser: false,
        },
        base: {
            title: 'יחידה',
            type: 'string',
            isEditableByUser: false,
        },
        last_test: {
            title: 'תאריך טסט אחרון',
            type: 'string',
            format: 'date',
            isEditableByUser: false,
        },
        next_test: {
            title: 'תאריך יעד לטסט הבא',
            type: 'string',
            format: 'date',
            isEditableByUser: false,
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
};

const crashEntityChildTemplate: IEntityChildTemplate = {
    name: 'crash_view',
    displayName: 'תאונה_פרטי תאונה',
    description: 'פרטי תאונה',
    fatherTemplateId: '683829d2657d1b63a9f4f257',
    categories: ['683829d2657d1b63a9f4f257'],
    properties: {
        car: {
            title: 'רכב',
            type: 'string',
            isEditableByUser: true,
        },
        date: {
            title: 'תאריך התאונה',
            type: 'string',
            format: 'date-time',
            isEditableByUser: true,
        },
        place: {
            title: 'מיקום',
            type: 'string',
            isEditableByUser: true,
        },
        mishpat: {
            title: 'משפט',
            type: 'string',
            format: 'date',
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
};

export { driverEntityChildTemplate, carEntityChildTemplate, crashEntityChildTemplate };
