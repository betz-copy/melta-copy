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
        },
        bd: {
            title: 'תאריך לידה',
            type: 'string',
            format: 'date',
        },
        phone: {
            title: 'מס טלפון',
            type: 'string',
        },
        unit: {
            title: 'יחידה',
            type: 'string',
        },
        gios_end: {
            title: 'תאריך שחרור',
            type: 'string',
            format: 'date',
        },
        license_status: {
            title: 'סטטוס רישיון',
            type: 'string',
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: true,
    isFilterByUserUnit: false,
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
        },
        base: {
            title: 'יחידה',
            type: 'string',
        },
        last_test: {
            title: 'תאריך טסט אחרון',
            type: 'string',
            format: 'date',
        },
        next_test: {
            title: 'תאריך יעד לטסט הבא',
            type: 'string',
            format: 'date',
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
};

export { driverEntityChildTemplate, carEntityChildTemplate };
