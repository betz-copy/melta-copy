import MockAdapter from 'axios-mock-adapter';

const entityTemplates = [
    {
        _id: '61e3ea6e4d51a83e87e83c7e',
        name: 'trip',
        displayName: 'טיול',
        category: {
            _id: '61e3dee74d51a83e87e83c7b',
            name: 'trips',
            displayName: 'טיולים',
        },
        properties: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    title: 'שם',
                },
                destination: {
                    type: 'string',
                    title: 'יעד',
                },
                startDate: {
                    type: 'string',
                    title: 'תאריך התחלה',
                    format: 'date',
                },
                endDate: {
                    type: 'string',
                    title: 'תאריך התחלה',
                    format: 'date',
                },
            },
            required: ['name', 'destination'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c7f',
        name: 'tourist',
        displayName: 'תייר',
        category: {
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
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
                age: {
                    type: 'number',
                    title: 'גיל',
                },
                gender: {
                    type: 'boolean',
                    title: 'זכר',
                },
            },
            required: ['firstName', 'lastName'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c80',
        name: 'travelAgent',
        displayName: 'סוכן נסיעות',
        category: {
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
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
                age: {
                    type: 'number',
                    title: 'גיל',
                },
                gender: {
                    type: 'boolean',
                    title: 'זכר',
                },
                agentId: {
                    type: 'string',
                    title: 'מזהה סוכן',
                },
            },
            required: ['firstName', 'lastName', 'agentId'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c81',
        name: 'flight',
        displayName: 'טיסה',
        category: {
            _id: '61e3d8384d51a83e87e83c75',
            name: 'flights',
            displayName: 'טיסות',
        },
        properties: {
            type: 'object',
            properties: {
                flightNumber: {
                    type: 'string',
                    title: 'מספר טיסה',
                },
                departureDate: {
                    type: 'string',
                    title: 'תאריך המראה',
                    format: 'date-time',
                },
                landingDate: {
                    type: 'string',
                    title: 'תאריך נחיתה',
                    format: 'date-time',
                },
                from: {
                    type: 'string',
                    title: 'מקום המראה',
                },
                to: {
                    type: 'string',
                    title: 'מקום הנחיתה',
                },
                planeType: {
                    type: 'string',
                    title: 'סוג המטוס',
                },
            },
            required: ['flightNumber', 'departureDate', 'landingDate'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c82',
        name: 'airport',
        displayName: 'שדה תעופה',
        category: {
            _id: '61e3d8384d51a83e87e83c75',
            name: 'flights',
            displayName: 'טיסות',
        },
        properties: {
            type: 'object',
            properties: {
                airportName: {
                    type: 'string',
                    title: 'שם',
                },
                airportId: {
                    type: 'string',
                    title: 'מזהה',
                },
                country: {
                    type: 'string',
                    title: 'מדינה',
                },
            },
            required: ['airportName', 'airportId', 'country'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c83',
        name: 'hotel',
        displayName: 'בית מלון',
        category: {
            _id: '61e3d8384d51a83e87e83c76',
            name: 'hotels',
            displayName: 'מלונות',
        },
        properties: {
            type: 'object',
            properties: {
                hotelName: {
                    type: 'string',
                    title: 'שם',
                },
                hotelChain: {
                    type: 'string',
                    title: 'שם רשת',
                },
                checkInDate: {
                    type: 'string',
                    title: 'תאריך הגעה',
                    format: 'date-time',
                },
                checkOutDate: {
                    type: 'string',
                    title: 'תאריך עזיבה',
                    format: 'date-time',
                },
                country: {
                    type: 'string',
                    title: 'מדינה',
                },
            },
            required: ['hotelName', 'checkInDate', 'checkOutDate', 'country'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c84',
        name: 'airbnb',
        displayName: 'אייר-ב.נ.ב',
        category: {
            _id: '61e3d8384d51a83e87e83c76',
            name: 'hotels',
            displayName: 'מלונות',
        },
        properties: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    title: 'שם',
                },
                checkInDate: {
                    type: 'string',
                    title: 'תאריך הגעה',
                    format: 'date-time',
                },
                checkOutDate: {
                    type: 'string',
                    title: 'תאריך עזיבה',
                    format: 'date-time',
                },
                country: {
                    type: 'string',
                    title: 'מדינה',
                },
            },
            required: ['name', 'checkInDate', 'checkOutDate', 'country'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c85',
        name: 'creditCard',
        displayName: 'כרטיס אשראי',
        category: {
            _id: '61e3d8384d51a83e87e83c77',
            name: 'money',
            displayName: 'כסף',
        },
        properties: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    title: 'שם',
                },
                company: {
                    type: 'string',
                    title: 'חברה',
                },
                expirtaionDate: {
                    type: 'string',
                    title: 'תאריך פג תוקף',
                    format: 'date',
                },
                monthlyAmount: {
                    type: 'number',
                    title: 'תקרה',
                },
            },
            required: ['name', 'company', 'expirtaionDate', 'monthlyAmount'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c86',
        name: 'check',
        // eslint-disable-next-line quotes
        displayName: "צ'ק",
        category: {
            _id: '61e3d8384d51a83e87e83c77',
            name: 'money',
            displayName: 'כסף',
        },
        properties: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    title: 'שם',
                },
                amount: {
                    type: 'number',
                    title: 'סכום',
                },
            },
            required: ['name', 'amount'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c87',
        name: 'phone',
        displayName: 'טלפון',
        category: {
            _id: '61e3d8384d51a83e87e83c79',
            name: 'communcation',
            displayName: 'תקשורת',
        },
        properties: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    title: 'דגם',
                },
                color: {
                    type: 'string',
                    title: 'צבע',
                },
                serialNumber: {
                    type: 'string',
                    title: 'מספר סריאלי',
                },
            },
            required: ['model', 'serialNumber'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c88',
        name: 'sim',
        displayName: 'סים',
        category: {
            _id: '61e3d8384d51a83e87e83c79',
            name: 'communcation',
            displayName: 'תקשורת',
        },
        properties: {
            type: 'object',
            properties: {
                company: {
                    type: 'string',
                    title: 'חברה',
                },
                number: {
                    type: 'number',
                    title: 'מספר',
                },
            },
            required: ['company', 'number'],
        },
    },
    {
        _id: '61e3ea6e4d51a83e87e83c89',
        name: 'suitcase',
        displayName: 'מזוודה',
        category: {
            _id: '61e3d8384d51a83e87e83c78',
            name: 'things',
            displayName: 'דברים',
        },
        properties: {
            type: 'object',
            properties: {
                company: {
                    type: 'string',
                    title: 'חברה',
                },
                color: {
                    type: 'string',
                    title: 'צבע',
                },
                weight: {
                    type: 'number',
                    title: 'משקל',
                },
            },
            required: ['company', 'color'],
        },
    },
];
const mockEntityTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/entities').reply(() => [
        200,
        {
            _id: '61e3ea6e4151a83e87e83c7e',
            name: 'trip',
            displayName: 'טיול',
            category: {
                _id: '61e3dee74d51a83e87e83c7b',
                name: 'trips',
                displayName: 'טיולים',
            },
            properties: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        title: 'שם',
                    },
                    destination: {
                        type: 'string',
                        title: 'יעד',
                    },
                    startDate: {
                        type: 'string',
                        title: 'תאריך התחלה',
                        format: 'date',
                    },
                    endDate: {
                        type: 'string',
                        title: 'תאריך התחלה',
                        format: 'date',
                    },
                },
                required: ['name', 'destination'],
            },
        },
    ]);

    // Update
    mock.onPut(/\/api\/templates\/entities\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'trip',
            displayName: 'טיולייי',
            category: {
                _id: '61e3dee74d51a83e87e83c7b',
                name: 'trips',
                displayName: 'טיולים',
            },
            properties: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        title: 'שם',
                    },
                    destination: {
                        type: 'string',
                        title: 'יעד',
                    },
                    startDate: {
                        type: 'string',
                        title: 'תאריך התחלה',
                        format: 'date',
                    },
                    endDate: {
                        type: 'string',
                        title: 'תאריך התחלה',
                        format: 'date',
                    },
                },
                required: ['name', 'destination'],
            },
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/entities\/[0-9a-fA-F]{24}/).reply(() => [200, {}]);
};

export { mockEntityTemplates, entityTemplates };
