import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import cookies from 'js-cookie';
import { environment } from './globals';
import { AuthService } from './services/authService';
// import faker from 'faker';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 5000,
    baseURL: '/api',
});

axios.interceptors.request.use(
    async (config) => {
        const accessToken = cookies.get(environment.accessTokenName);
        if (accessToken) {
            // eslint-disable-next-line no-param-reassign
            config.headers!.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        Promise.reject(error);
    },
);

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response.status === 401) {
            AuthService.logout();
        }

        return Promise.reject(error);
    },
);

if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_IS_DOCKER) {
    console.log('Development Environment, using axios mock');

    const mock = new MockAdapter(axios, { delayResponse: 500 });

    mock.onGet('/api/config').reply(() => [
        200,
        {
            contactByMailLink: 'mailAdr@gmail.com',
            contactByChatLink: 'http://chat.com',
        },
    ]);

    mock.onGet(/\/api\/categories\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
        },
    ]);

    mock.onGet(/\/api\/categories\.*/).reply(() => [
        200,
        [
            {
                _id: '61e3d8384d51a83e87e83c74',
                name: 'pepole',
                displayName: 'אנשים',
            },
            {
                _id: '61e3d8384d51a83e87e83c75',
                name: 'flights',
                displayName: 'טיסות',
            },
            {
                _id: '61e3d8384d51a83e87e83c76',
                name: 'hotels',
                displayName: 'מלונות',
            },
            {
                _id: '61e3d8384d51a83e87e83c77',
                name: 'money',
                displayName: 'כסף',
            },
            {
                _id: '61e3d8384d51a83e87e83c78',
                name: 'things',
                displayName: 'דברים',
            },
            {
                _id: '61e3d8384d51a83e87e83c79',
                name: 'communcation',
                displayName: 'תקשורת',
            },
            {
                _id: '61e3dee74d51a83e87e83c7b',
                name: 'trips',
                displayName: 'טיולים',
            },
        ],
    ]);

    mock.onPost('/api/categories').reply(() => [
        200,
        {
            _id: '61e328384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
        },
    ]);

    mock.onPut(/\/api\/categories\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנששדגשדגים',
        },
    ]);

    mock.onGet(/\/api\/entities\/templates\/[0-9a-fA-F]{24}/).reply(() => [
        200,
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
    ]);

    mock.onGet(/\/api\/entities\/templates\?category=[0-9a-fA-F]{24}/).reply(() => [
        200,
        [
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
        ],
    ]);

    mock.onGet(/\/api\/entities\/templates.*/).reply(() => [
        200,
        [
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
                            title: 'שם',
                        },
                        checkInDate: {
                            type: 'string',
                            title: 'תאריך הגעה',
                            format: 'date-time',
                        },
                        checkOutDate: {
                            type: 'string',
                            title: 'תאריך עזזיבה',
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
                            title: 'תאריך עזזיבה',
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
        ],
    ]);

    mock.onPost('/api/entities/templates').reply(() => [
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

    mock.onPut(/\/api\/entities\/templates\/[0-9a-fA-F]{24}/).reply(() => [
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

    mock.onPost('/api/relationships/templates').reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'trip',
            sourceEntityId: '61e3ea6e4d51653e87e83c7e',
            destinationEntityId: '61e3ea6e4d5143e87e83c7e',
        },
    ]);

    mock.onPost('/api/entities').reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
        },
    ]);

    mock.onGet(/\/api\/entities\?category=[0-9a-fA-F]{24}/).reply(() => [
        200,
        [
            {
                _id: '61f28035d372f97e321b1ceb',
                templateId: '61e3ea6e4d51a83e87e83c80',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'איילה',
                    lastName: 'נסיעות',
                    age: 40,
                    gender: false,
                    agentId: 'a1b2c3',
                },
            },
            {
                _id: '61f28035d372f97e321b1cec',
                templateId: '61e3ea6e4d51a83e87e83c80',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'ארנון',
                    lastName: 'פז',
                    age: 46,
                    gender: true,
                    agentId: 'd4e5f6',
                },
            },
            {
                _id: '61f28035d372f97e321b1ced',
                templateId: '61e3ea6e4d51a83e87e83c80',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'סקי',
                    lastName: 'דיל',
                    age: 35,
                    gender: true,
                    agentId: 'g7h8i9',
                },
            },
            {
                _id: '61f28042d372f97e321b1cee',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'איתי',
                    lastName: 'לוי',
                    age: 30,
                    gender: true,
                },
            },
            {
                _id: '61f28042d372f97e321b1cef',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'אייל',
                    lastName: 'גולן',
                    age: 42,
                    gender: true,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf0',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'נועה',
                    lastName: 'קירל',
                    age: 20,
                    gender: false,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf1',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'סטטיק',
                    lastName: 'זה חזק',
                    age: 28,
                    gender: true,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf2',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'גל',
                    lastName: 'גדות',
                    age: 35,
                    gender: false,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf3',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'בר',
                    lastName: 'רפאלי',
                    age: 36,
                    gender: false,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf4',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'סבא',
                    lastName: 'טוביה',
                    age: 76,
                    gender: true,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf5',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'אדיר',
                    lastName: 'מילר',
                    age: 43,
                    gender: true,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf6',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'עודד',
                    lastName: 'פז',
                    age: 36,
                    gender: true,
                },
            },
            {
                _id: '61f28042d372f97e321b1cf7',
                templateId: '61e3ea6e4d51a83e87e83c7f',
                categoryId: '61e3d8384d51a83e87e83c74',
                properties: {
                    firstName: 'אלונה',
                    lastName: 'טל',
                    age: 38,
                    gender: false,
                },
            },
        ],
    ]);

    mock.onGet('/api/entities/all').reply(() => [
        200,
        {
            nodes: [
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    name: 'טיול בר מצווה ללונדון',
                    destination: 'לונדון',
                    startDate: '2013-01-01',
                    endDate: '2013-01-10',
                    id: 100,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    name: 'טיול משפחות בצרפת והולנד',
                    destination: 'הולנד',
                    id: 101,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    name: 'סקי באיטליה',
                    destination: 'איטליה',
                    startDate: '2017-11-29',
                    endDate: '2017-12-05',
                    id: 102,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    name: 'מסיבות בקפרסיןי',
                    destination: 'קפריסין',
                    id: 103,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    name: 'חי את החלום בבהאמה',
                    destination: 'בהאמה',
                    startDate: '2020-07-17',
                    endDate: '2020-08-03',
                    id: 104,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    firstName: 'איילה',
                    lastName: 'נסיעות',
                    age: 40,
                    gender: false,
                    agentId: 'a1b2c3',
                    id: 105,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    firstName: 'ארנון',
                    lastName: 'פז',
                    age: 46,
                    gender: true,
                    agentId: 'd4e5f6',
                    id: 106,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    firstName: 'סקי',
                    lastName: 'דיל',
                    age: 35,
                    gender: true,
                    agentId: 'g7h8i9',
                    id: 107,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'איתי',
                    lastName: 'לוי',
                    age: 30,
                    gender: true,
                    id: 108,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'אייל',
                    lastName: 'גולן',
                    age: 42,
                    gender: true,
                    id: 109,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'נועה',
                    lastName: 'קירל',
                    age: 20,
                    gender: false,
                    id: 110,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'סטטיק',
                    lastName: 'זה חזק',
                    age: 28,
                    gender: true,
                    id: 111,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'גל',
                    lastName: 'גדות',
                    age: 35,
                    gender: false,
                    id: 112,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'בר',
                    lastName: 'רפאלי',
                    age: 36,
                    gender: false,
                    id: 113,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'סבא',
                    lastName: 'טוביה',
                    age: 76,
                    gender: true,
                    id: 114,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'אדיר',
                    lastName: 'מילר',
                    age: 43,
                    gender: true,
                    id: 115,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'עודד',
                    lastName: 'פז',
                    age: 36,
                    gender: true,
                    id: 116,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    firstName: 'אלונה',
                    lastName: 'טל',
                    age: 38,
                    gender: false,
                    id: 117,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    company: 'מזוודה בעם',
                    color: 'שחור',
                    weight: 12,
                    id: 118,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    company: 'מזוודה בעם',
                    color: 'כחול',
                    weight: 16,
                    id: 119,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    company: 'מזוודה בעם',
                    color: 'שחור',
                    weight: 8,
                    id: 120,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    company: 'ריקושט',
                    color: 'שחור',
                    weight: 7,
                    id: 121,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    company: 'ריקושט',
                    color: 'שחור',
                    weight: 10,
                    id: 122,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    company: 'ריקושט',
                    color: 'שחור',
                    weight: 21,
                    id: 123,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    company: 'at&t',
                    number: 543458942,
                    id: 124,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    company: 'vodaphone',
                    number: 154458942,
                    id: 125,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    company: 'pelephone',
                    number: 5434535628,
                    id: 126,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    company: 'vodaphone',
                    number: 1958535628,
                    id: 127,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    model: 'גלקסי S12',
                    color: 'שחור',
                    serialNumber: '12341231231',
                    id: 128,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    model: 'גלקסי S13',
                    color: 'כחול',
                    serialNumber: '12341781231',
                    id: 129,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    model: 'אייפון 13 מקס פרו ',
                    color: 'לבן',
                    serialNumber: '45678912358',
                    id: 130,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    model: 'וואן פלאס S12',
                    color: 'ירוק',
                    serialNumber: '12456731231',
                    id: 131,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    model: 'גלקסי A70',
                    color: 'שחור',
                    serialNumber: '13941231231',
                    id: 132,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    model: 'גלקסי S12',
                    color: 'לבן',
                    serialNumber: '12365431231',
                    id: 133,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    hotelName: 'hotel la vie',
                    hotelChain: 'novo',
                    checkInDate: '2017-05-12',
                    checkOutDate: '2017-05-16',
                    country: 'צרפת',
                    id: 134,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    hotelName: 'hotel la butique',
                    checkInDate: '2020-08-10',
                    checkOutDate: '2020-08-16',
                    country: 'קפריסין',
                    id: 135,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    hotelName: 'hotel la grande',
                    hotelChain: 'novo',
                    checkInDate: '2019-01-12',
                    checkOutDate: '2019-01-16',
                    country: 'בהאמה',
                    id: 136,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    hotelName: 'hotel la la',
                    checkInDate: '2013-04-02',
                    checkOutDate: '20173-04-09',
                    country: 'איטליה',
                    id: 137,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AA123',
                    departureDate: '2020-01-15T13:30:00.000Z',
                    landingDate: '2020-01-15T14:30:00.000Z',
                    from: 'NYC',
                    to: 'ORL',
                    planeType: 'B747-400',
                    id: 138,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AA123',
                    departureDate: '2020-01-17T13:30:00.000Z',
                    landingDate: '2020-01-17T14:30:00.000Z',
                    from: 'NYC',
                    to: 'ORL',
                    planeType: 'B747-200',
                    id: 139,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AA123',
                    departureDate: '2020-01-19T13:30:00.000Z',
                    landingDate: '2020-01-19T14:30:00.000Z',
                    from: 'NYC',
                    to: 'ORL',
                    planeType: 'B747-300',
                    id: 140,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'ACA156',
                    departureDate: '2020-03-20T13:30:00.000Z',
                    landingDate: '2020-03-20T15:30:00.000Z',
                    from: 'TLV',
                    to: 'CYP',
                    planeType: 'A380-400',
                    id: 141,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'ACA154',
                    departureDate: '2020-03-20T15:30:00.000Z',
                    landingDate: '2020-03-20T17:30:00.000Z',
                    from: 'CYP',
                    to: 'TLV',
                    planeType: 'A380-400',
                    id: 142,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'ACA157',
                    departureDate: '2020-03-10T13:30:00.000Z',
                    landingDate: '2020-03-10T15:30:00.000Z',
                    from: 'TLV',
                    to: 'CYP',
                    planeType: 'A320-400',
                    id: 143,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'ACA156',
                    departureDate: '2020-03-10T15:30:00.000Z',
                    landingDate: '2020-03-10T17:30:00.000Z',
                    from: 'CYP',
                    to: 'TLV',
                    planeType: 'A320-400',
                    id: 144,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AFR432',
                    departureDate: '2020-03-20T13:30:00.000Z',
                    landingDate: '2020-03-20T15:30:00.000Z',
                    from: 'TLV',
                    to: 'PAR',
                    planeType: 'A380-400',
                    id: 145,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AFR431',
                    departureDate: '2020-05-20T15:30:00.000Z',
                    landingDate: '2020-05-20T17:30:00.000Z',
                    from: 'CYP',
                    to: 'PAR',
                    planeType: 'A380-400',
                    id: 146,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AFR433',
                    departureDate: '2020-06-10T13:30:00.000Z',
                    landingDate: '2020-06-10T15:30:00.000Z',
                    from: 'PAR',
                    to: 'TLV',
                    planeType: 'A320-400',
                    id: 147,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'AFR437',
                    departureDate: '2020-06-10T15:30:00.000Z',
                    landingDate: '2020-06-10T17:30:00.000Z',
                    from: 'PAR',
                    to: 'TLV',
                    planeType: 'A320-400',
                    id: 148,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'LY548',
                    departureDate: '2017-11-29T15:30:00.000Z',
                    landingDate: '2017-11-29T17:30:00.000Z',
                    from: 'TLV',
                    to: 'MIL',
                    planeType: 'B787-200',
                    id: 149,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'LY549',
                    departureDate: '2017-11-29T05:00:00.000Z',
                    landingDate: '2017-11-29T07:00:00.000Z',
                    from: 'TLV',
                    to: 'MIL',
                    planeType: 'B787-200',
                    id: 150,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'LY348',
                    departureDate: '2017-12-05T15:30:00.000Z',
                    landingDate: '2017-12-05T17:30:00.000Z',
                    from: 'MIL',
                    to: 'TLV',
                    planeType: 'B787-200',
                    id: 151,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'LY349',
                    departureDate: '2017-12-05T05:00:00.000Z',
                    landingDate: '2017-12-05T07:00:00.000Z',
                    from: 'MIL',
                    to: 'TLV',
                    planeType: 'B787-200',
                    id: 152,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'KLM856',
                    departureDate: '2020-07-17T05:00:00.000Z',
                    landingDate: '2020-07-17T07:00:00.000Z',
                    from: 'BHM',
                    to: 'TLV',
                    planeType: 'B787-200',
                    id: 153,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    flightNumber: 'KLM857',
                    departureDate: '2020-07-17T15:00:00.000Z',
                    landingDate: '2020-07-17T17:00:00.000Z',
                    from: 'BHM',
                    to: 'TLV',
                    planeType: 'B787-200',
                    id: 154,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    name: '1234123412341234',
                    company: 'visa',
                    expirtaionDate: '2025-12-12',
                    monthlyAmount: 6500,
                    id: 155,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    name: '456456456456456',
                    company: 'card',
                    expirtaionDate: '2022-06-12',
                    monthlyAmount: 12300,
                    id: 156,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    name: '687687687687687',
                    company: 'visa',
                    expirtaionDate: '2020-08-30',
                    monthlyAmount: 3000,
                    id: 157,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    name: '159159159159159',
                    company: 'card',
                    expirtaionDate: '2026-01-19',
                    monthlyAmount: 6500,
                    id: 158,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    name: '675676567656765',
                    company: 'visa',
                    expirtaionDate: '2026-02-22',
                    monthlyAmount: 6500,
                    id: 159,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c84',
                    name: 'hara dira',
                    checkInDate: '2018-05-12',
                    checkOutDate: '2018-05-16',
                    country: 'שומקום',
                    id: 160,
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c84',
                    name: 'hara makom',
                    checkInDate: '2018-08-09',
                    checkOutDate: '2018-08-21',
                    country: 'משעמם',
                    id: 161,
                },
            ],
            links: Array.from({ length: 100 }, () => {
                return { source: Math.floor(Math.random() * 62) + 100, target: Math.floor(Math.random() * 62) + 100, value: 1 };
            }),
        },
    ]);

    mock.onGet(/\/api\/entities\/[0-9]{3}/).reply((config) => {
        return [
            200,
            {
                nodes: [
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                        name: 'סקי באיטליה',
                        destination: 'איטליה',
                        startDate: '2017-11-29',
                        endDate: '2017-12-05',
                        id: config.url!.split('/')[3],
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c80',
                        firstName: 'ארנון',
                        lastName: 'פז',
                        age: 46,
                        gender: true,
                        agentId: 'd4e5f6',
                        id: 1001,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        firstName: 'גל',
                        lastName: 'גדות',
                        age: 35,
                        gender: false,
                        id: 1002,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        firstName: 'בר',
                        lastName: 'רפאלי',
                        age: 36,
                        gender: false,
                        id: 1003,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        firstName: 'סבא',
                        lastName: 'טוביה',
                        age: 76,
                        gender: true,
                        id: 1004,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        firstName: 'אדיר',
                        lastName: 'מילר',
                        age: 43,
                        gender: true,
                        id: 1005,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c89',
                        company: 'ריקושט',
                        color: 'שחור',
                        weight: 21,
                        id: 1006,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c88',
                        company: 'at&t',
                        number: 543458942,
                        id: 1007,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c88',
                        company: 'vodaphone',
                        number: 1958535628,
                        id: 1008,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c87',
                        model: 'גלקסי A70',
                        color: 'שחור',
                        serialNumber: '13941231231',
                        id: 1009,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c87',
                        model: 'גלקסי S12',
                        color: 'לבן',
                        serialNumber: '12365431231',
                        id: 1010,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        hotelName: 'hotel la vie',
                        hotelChain: 'novo',
                        checkInDate: '2017-05-12',
                        checkOutDate: '2017-05-16',
                        country: 'צרפת',
                        id: 1011,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        hotelName: 'hotel la la',
                        checkInDate: '2013-04-02',
                        checkOutDate: '20173-04-09',
                        country: 'איטליה',
                        id: 1012,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c85',
                        name: '159159159159159',
                        company: 'card',
                        expirtaionDate: '2026-01-19',
                        monthlyAmount: 6500,
                        id: 1013,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c85',
                        name: '675676567656765',
                        company: 'visa',
                        expirtaionDate: '2026-02-22',
                        monthlyAmount: 6500,
                        id: 1014,
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c84',
                        name: 'hara makom',
                        checkInDate: '2018-08-09',
                        checkOutDate: '2018-08-21',
                        country: 'משעמם',
                        id: 1015,
                    },
                ],
                links: [
                    ...Array.from({ length: 10 }, () => {
                        return { source: Math.floor(Math.random() * 14) + 1001, target: Math.floor(Math.random() * 14) + 1001, value: 1 };
                    }),
                    ...Array.from({ length: 15 }, (_i, index) => {
                        return { source: config.url!.split('/')[3], target: index + 1001, value: 5 };
                    }),
                ],
            },
        ];
    });
}

export default axios;
