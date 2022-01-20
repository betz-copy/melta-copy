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
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
        },
    ]);

    mock.onGet(/\/api\/entities\/templates\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'trip',
            displayName: 'טיול',
            category: '61e3dee74d51a83e87e83c7b',
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

    mock.onGet(/\/api\/entities\/templates.*/).reply(() => [
        200,
        [
            {
                _id: '61e3ea6e4d51a83e87e83c7e',
                name: 'trip',
                displayName: 'טיול',
                category: '61e3dee74d51a83e87e83c7b',
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
                category: '61e3d8384d51a83e87e83c74',
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
                            type: 'integer',
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
                category: '61e3d8384d51a83e87e83c74',
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
                            type: 'integer',
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
                category: '61e3d8384d51a83e87e83c75',
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
                category: '61e3d8384d51a83e87e83c75',
                properties: {
                    type: 'object',
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
            },
            {
                _id: '61e3ea6e4d51a83e87e83c83',
                name: 'hotel',
                displayName: 'בית מלון',
                category: '61e3d8384d51a83e87e83c76',
                properties: {
                    type: 'object',
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
            },
            {
                _id: '61e3ea6e4d51a83e87e83c84',
                name: 'airbnb',
                displayName: 'אייר-ב.נ.ב',
                category: '61e3d8384d51a83e87e83c76',
                properties: {
                    type: 'object',
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
            },
            {
                _id: '61e3ea6e4d51a83e87e83c85',
                name: 'creditCard',
                displayName: 'כרטיס אשראי',
                category: '61e3d8384d51a83e87e83c77',
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
                category: '61e3d8384d51a83e87e83c77',
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
                category: '61e3d8384d51a83e87e83c79',
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
                category: '61e3d8384d51a83e87e83c79',
                properties: {
                    type: 'object',
                    properties: {
                        company: {
                            type: 'string',
                            title: 'חברה',
                        },
                        number: {
                            type: 'integer',
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
                category: '61e3d8384d51a83e87e83c78',
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
                            type: 'integer',
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
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'trip',
            displayName: 'טיול',
            category: '61e3dee74d51a83e87e83c7b',
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
}

configure({ axios });

export { useAxios };

export default axios;
