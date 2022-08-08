import MockAdapter from 'axios-mock-adapter';

const entityTemplates = [
    {
        _id: '61e3ea6e4d51a83e87e83c7e',
        name: 'trip',
        displayName: 'טיול',
        disabled: false,
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
                firstFile: {
                    type: 'string',
                    title: 'קובץ',
                    format: 'fileId',
                },
                options: {
                    type: 'string',
                    title: 'רשימה',
                    enum: ['אפשרות1', 'אפשרות2'],
                },
            },
            required: ['name', 'destination', 'firstFile'],
        },
        propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'options', 'firstFile'],
        propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c7f',
        name: 'tourist',
        displayName: 'תייר',
        disabled: true,
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
                firstFile: {
                    type: 'string',
                    title: 'קובץ',
                    format: 'fileId',
                },
            },
            required: ['firstName', 'lastName', 'firstFile'],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'firstFile'],
        propertiesPreview: ['firstName', 'lastName', 'age'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c80',
        name: 'travelAgent',
        displayName: 'סוכן נסיעות',
        disabled: true,
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
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
        propertiesPreview: ['firstName', 'lastName', 'age'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c81',
        name: 'flight',
        displayName: 'טיסה',
        disabled: false,
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
            required: ['flightNumber', 'departureDate', 'landingDate', 'from'],
        },
        propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
        propertiesPreview: ['flightNumber', 'from', 'to'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c82',
        name: 'airport',
        displayName: 'שדה תעופה',
        disabled: false,
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
        propertiesOrder: ['airportName', 'airportId', 'country'],
        propertiesPreview: ['airportName', 'country'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c83',
        name: 'hotel',
        displayName: 'בית מלון',
        disabled: false,
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
        propertiesOrder: ['hotelName', 'hotelChain', 'checkInDate', 'checkOutDate', 'country'],
        propertiesPreview: ['hotelName', 'checkInDate', 'checkOutDate'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c84',
        name: 'airbnb',
        displayName: 'אייר-ב.נ.ב',
        disabled: false,
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
        propertiesOrder: ['name', 'checkInDate', 'checkOutDate', 'country'],
        propertiesPreview: ['name', 'checkInDate', 'checkOutDate'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c85',
        name: 'creditCard',
        displayName: 'כרטיס אשראי',
        disabled: false,
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
        propertiesOrder: ['name', 'company', 'expirtaionDate', 'monthlyAmount'],
        propertiesPreview: ['name', 'expirtaionDate'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c86',
        name: 'check',
        // eslint-disable-next-line quotes
        displayName: "צ'ק",
        disabled: false,
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
        propertiesOrder: ['name', 'amount'],
        propertiesPreview: ['name', 'amount'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c87',
        name: 'phone',
        displayName: 'טלפון',
        disabled: false,
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
        propertiesOrder: ['model', 'color', 'serialNumber'],
        propertiesPreview: ['model', 'serialNumber'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c88',
        name: 'sim',
        displayName: 'סים',
        disabled: false,
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
        propertiesOrder: ['company', 'number'],
        propertiesPreview: ['company', 'number'],
    },
    {
        _id: '61e3ea6e4d51a83e87e83c89',
        name: 'suitcase',
        displayName: 'מזוודה',
        disabled: false,
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
        propertiesOrder: ['company', 'color', 'weight'],
        propertiesPreview: ['company', 'weight'],
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
            propertiesOrder: ['name', 'destination', 'startDate', 'endDate'],
            propertiesPreview: ['name', 'destination'],
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
            propertiesOrder: ['name', 'destination', 'startDate', 'endDate'],
            propertiesPreview: ['name', 'destination'],
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/entities\/[0-9a-fA-F]{24}/).reply(() => [200, {}]);
};

export { mockEntityTemplates, entityTemplates };
