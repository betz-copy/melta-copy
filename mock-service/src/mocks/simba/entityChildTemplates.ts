import { IChildTemplate, ViewType } from '@microservices/shared';

const driverEntityChildTemplate: IChildTemplate = {
    name: 'driver_view',
    displayName: 'נהג_פרטי הנוהג',
    description: 'פרטי הנוהג',
    fatherTemplateId: '683829d2657d1b63a9f4f25b',
    categories: ['683829d2657d1b63a9f4f257'],
    properties: {
        properties: {
            tz: {
                isEditableByUser: false,
            },
            bd: {
                isEditableByUser: false,
            },
            phone: {
                isEditableByUser: false,
            },
            unit: {
                isEditableByUser: false,
            },
            gios_end: {
                isEditableByUser: false,
            },
            license_status: {
                isEditableByUser: false,
            },
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: true,
    isFilterByUserUnit: false,
};

const carEntityChildTemplate: IChildTemplate = {
    name: 'car_view',
    displayName: 'רכב_פרטי רכב',
    description: 'פרטי רכב',
    fatherTemplateId: '683829d2657d1b63a9f4f26e',
    categories: ['683829d2657d1b63a9f4f257'],
    properties: {
        properties: {
            ID: {
                isEditableByUser: false,
            },
            base: {
                isEditableByUser: false,
            },
            last_test: {
                isEditableByUser: false,
            },
            next_test: {
                isEditableByUser: false,
            },
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
};

const crashEntityChildTemplate: IChildTemplate = {
    name: 'crash_view',
    displayName: 'תאונה_פרטי תאונה',
    description: 'פרטי תאונה',
    fatherTemplateId: '683829d2657d1b63a9f4f257',
    categories: ['683829d2657d1b63a9f4f257'],
    properties: {
        properties: {
            car: {
                isEditableByUser: true,
            },
            date: {
                isEditableByUser: true,
            },
            place: {
                isEditableByUser: true,
            },
            mishpat: {},
        },
    },
    disabled: false,
    viewType: ViewType.userPage,
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
};

export { driverEntityChildTemplate, carEntityChildTemplate, crashEntityChildTemplate };
