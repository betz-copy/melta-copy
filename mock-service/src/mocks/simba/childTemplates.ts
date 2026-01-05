import { IChildTemplate, ViewType } from '@packages/child-template';

const driverChildTemplate: IChildTemplate = {
    name: 'driver_view',
    displayName: 'נהג_פרטי הנוהג',
    description: 'פרטי הנוהג',
    parentTemplateId: '683829d2657d1b63a9f4f25b',
    category: '683829d2657d1b63a9f4f257',
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
    filterByCurrentUserField: 'full_name',
};

const carChildTemplate: IChildTemplate = {
    name: 'car_view',
    displayName: 'רכב_פרטי רכב',
    description: 'פרטי רכב',
    parentTemplateId: '683829d2657d1b63a9f4f26e',
    category: '683829d2657d1b63a9f4f257',
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

const crashChildTemplate: IChildTemplate = {
    name: 'crash_view',
    displayName: 'תאונה_פרטי תאונה',
    description: 'פרטי תאונה',
    parentTemplateId: '683829d2657d1b63a9f4f257',
    category: '683829d2657d1b63a9f4f257',
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

export { driverChildTemplate, carChildTemplate, crashChildTemplate };
