export const entityTemplates = [
    {
        name: 'trip',
        displayName: 'טיול',
        category: {
            name: 'trips',
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
                    title: 'תאריך סיום',
                    format: 'date',
                },
                firstFile: {
                    type: 'string',
                    title: 'קובץ ראשון',
                    format: 'fileId',
                },
            },
            required: ['name', 'destination'],
        },
    },
    {
        name: 'tourist',
        displayName: 'תייר',
        category: {
            name: 'pepole',
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
        name: 'travelAgent',
        displayName: 'סוכן נסיעות',
        category: {
            name: 'pepole',
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
        name: 'flight',
        displayName: 'טיסה',
        category: {
            name: 'flights',
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
        name: 'airport',
        displayName: 'שדה תעופה',
        category: {
            name: 'flights',
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
        name: 'hotel',
        displayName: 'בית מלון',
        category: {
            name: 'hotels',
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
        name: 'airbnb',
        displayName: 'אייר-ב.נ.ב',
        category: {
            name: 'hotels',
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
        name: 'creditCard',
        displayName: 'כרטיס אשראי',
        category: {
            name: 'money',
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
        name: 'check',
        // eslint-disable-next-line quotes
        displayName: "צ'ק",
        category: {
            name: 'money',
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
        name: 'phone',
        displayName: 'טלפון',
        category: {
            name: 'communcation',
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
        name: 'sim',
        displayName: 'סים',
        category: {
            name: 'communcation',
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
        name: 'suitcase',
        displayName: 'מזוודה',
        category: {
            name: 'things',
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
