import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { IMongoEntityTemplatePopulated } from '@microservices/shared';

const entityTemplates: IMongoEntityTemplatePopulated[] = [
    {
        _id: '61e3ea6e4d51a83e87e83c7e',
        name: 'trip',
        displayName: 'טיול',
        disabled: false,
        category: {
            _id: '61e3dee74d51a83e87e83c7b',
            name: 'trips',
            displayName: 'טיולים',
            color: '#B3E5FC',
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
            hide: ['destination'],
        },
        propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'options', 'firstFile'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'startDate', 'endDate'],
        uniqueConstraints: [],
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
            color: '#B80000',
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
            hide: [],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'firstFile'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['firstName', 'lastName', 'age'],
        uniqueConstraints: [],
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
            color: '#B80000',
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
            hide: ['agentId'],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['firstName', 'lastName', 'age'],
        uniqueConstraints: [],
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
            color: '#E65100',
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
                    enum: ['a', 'b', 'c', 'd'],
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
            hide: [],
        },
        propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['flightNumber', 'from', 'to'],
        uniqueConstraints: [],
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
            color: '#E65100',
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
            hide: ['airportId'],
        },
        propertiesOrder: ['airportName', 'airportId', 'country'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['airportName', 'country'],
        uniqueConstraints: [],
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
            color: '#FCDC00',
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
            hide: ['country'],
        },
        uniqueConstraints: [],
        propertiesPreview: ['hotelName', 'checkInDate', 'checkOutDate'],
        propertiesOrder: ['hotelName', 'hotelChain', 'checkInDate', 'checkOutDate', 'country'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
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
            color: '#FCDC00',
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
            hide: ['country'],
        },
        propertiesOrder: ['name', 'checkInDate', 'checkOutDate', 'country'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'checkInDate', 'checkOutDate'],
        uniqueConstraints: [],
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
            color: '#F78DA7',
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
            hide: ['company'],
        },
        propertiesOrder: ['name', 'company', 'expirtaionDate', 'monthlyAmount'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'expirtaionDate'],
        uniqueConstraints: [],
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
            color: '#F78DA7',
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
            hide: [],
        },
        propertiesOrder: ['name', 'amount'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'amount'],
        uniqueConstraints: [],
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
            color: '#0D47A1',
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
            hide: [],
        },
        propertiesOrder: ['model', 'color', 'serialNumber'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['model', 'serialNumber'],
        uniqueConstraints: [],
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
            color: '#0D47A1',
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
            hide: [],
        },
        propertiesOrder: ['company', 'number'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['company', 'number'],
        uniqueConstraints: [],
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
            color: '#7B1FA2',
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
            hide: [],
        },
        propertiesOrder: ['company', 'color', 'weight'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['company', 'weight'],
        uniqueConstraints: [],
    },
];
const mockEntityTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/entities').reply(() => [
        StatusCodes.OK,
        {
            _id: '61e3ea6e4151a83e87e83c7e',
            name: 'trip',
            displayName: 'טיול',
            category: {
                _id: '61e3dee74d51a83e87e83c7b',
                name: 'trips',
                displayName: 'טיולים',
                color: '#B3E5FC',
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
                unique: [],
                hide: ['destination'],
            },
            propertiesOrder: ['name', 'destination', 'startDate', 'endDate'],
            propertiesTypeOrder: ['properties', 'attachmentProperties'],
            propertiesPreview: ['name'],
        },
    ]);

    // Update
    mock.onPut(/\/api\/templates\/entities\/[0-9a-fA-F]{24}/).reply(() => [
        StatusCodes.OK,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'trip',
            displayName: 'טיולייי',
            category: {
                _id: '61e3dee74d51a83e87e83c7b',
                name: 'trips',
                displayName: 'טיולים',
                color: '#B3E5FC',
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
                unique: [],
                hide: ['destination'],
            },
            propertiesOrder: ['name', 'destination', 'startDate', 'endDate'],
            propertiesTypeOrder: ['properties', 'attachmentProperties'],
            propertiesPreview: ['name'],
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/entities\/[0-9a-fA-F]{24}/).reply(() => [StatusCodes.OK, {}]);
};

export { mockEntityTemplates, entityTemplates };
