import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import useAxios, { configure } from 'axios-hooks';
import cookies from 'js-cookie';
import { environment } from './globals';
import { AuthService } from './services/authService';
// import faker from 'faker';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 5000,
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
}

configure({ axios });

export { useAxios };

export default axios;
