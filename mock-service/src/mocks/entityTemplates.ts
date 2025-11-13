import { IEntityTemplateMock } from '../templates/entityTemplates';

// TODO: create entityTemplates with backend service in order to add required+unique constraints
const entityTemplates: IEntityTemplateMock[] = [
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
                location: {
                    type: 'string',
                    title: 'מיקום',
                    format: 'location',
                },
            },
            hide: [],
        },
        propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile', 'location'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
        disabled: false,
    },
    {
        name: 'tourist',
        displayName: 'תייר',
        category: {
            name: 'people',
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
            hide: ['lastName'],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['firstName', 'age'],
        disabled: false,
    },
    {
        name: 'travelAgent',
        displayName: 'סוכן נסיעות',
        category: {
            name: 'people',
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
                location: {
                    type: 'string',
                    title: 'מקום מגורים',
                    format: 'location',
                },
            },
            hide: ['lastName'],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId', 'location'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['firstName', 'age'],
        disabled: false,
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
                seatType: {
                    type: 'string',
                    title: 'סוג מושב',
                    enum: ['ביזנס', 'עסקים', 'תיירים פלוס', 'תיירים'],
                },
                location: {
                    type: 'string',
                    title: 'יעד',
                    format: 'location',
                },
            },
            hide: ['departureDate'],
        },
        propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType', 'seatType', 'location'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['flightNumber', 'from', 'to'],
        disabled: false,
    },
    {
        name: 'flightOfSkyPlaner',
        displayName: 'טיסה של המודל',
        category: {
            name: 'flights',
        },
        properties: {
            type: 'object',
            properties: {
                FlightNum: {
                    type: 'string',
                    title: 'מספר טיסה',
                },
                Flighttype: {
                    type: 'string',
                    title: 'סוג טיסה',
                    enum: ['ביזנס', 'עסקים', 'תיירים'],
                },
                FlightPlatform: {
                    type: 'string',
                    title: 'פלטפורמת טיסה',
                    enum: ['פלטפורמה א', 'פלטפורמה ב'],
                },
                FlightDepart: {
                    type: 'string',
                    title: 'מוצא',
                    enum: ['וינה', 'אתונה', 'תל אביב', 'רומא'],
                },
                FlightDest: {
                    type: 'string',
                    title: 'יעד',
                    enum: ['וינה', 'אתונה', 'תל אביב', 'רומא'],
                },
                FlightDepTime: {
                    type: 'string',
                    title: 'תאריך המראה',
                    format: 'date-time',
                },
                FlightArrTime: {
                    type: 'string',
                    title: 'תאריך נחיתה',
                    format: 'date-time',
                },
            },
            hide: ['FlightPlatform'],
        },
        propertiesOrder: ['FlightNum', 'Flighttype', 'FlightPlatform', 'FlightDepart', 'FlightDest', 'FlightDepTime', 'FlightArrTime'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['FlightNum', 'FlightDepart', 'FlightDest'],
        disabled: false,
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
            hide: ['airportId'],
        },
        propertiesOrder: ['airportName', 'airportId', 'country'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['airportName', 'country'],
        disabled: false,
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
            hide: ['country'],
        },
        propertiesOrder: ['hotelName', 'hotelChain', 'checkInDate', 'checkOutDate', 'country'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['hotelName', 'checkInDate', 'checkOutDate'],
        disabled: false,
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
            hide: ['country'],
        },
        propertiesOrder: ['name', 'checkInDate', 'checkOutDate', 'country'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'checkInDate', 'checkOutDate'],
        disabled: false,
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
            hide: ['company'],
        },
        propertiesOrder: ['name', 'company', 'expirtaionDate', 'monthlyAmount'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'expirtaionDate'],
        disabled: false,
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
            hide: [],
        },
        propertiesOrder: ['name', 'amount'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['name', 'amount'],
        disabled: false,
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
            hide: [],
        },
        propertiesOrder: ['model', 'color', 'serialNumber'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['model', 'serialNumber'],
        disabled: false,
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
            hide: [],
        },
        propertiesOrder: ['company', 'number'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['company', 'number'],
        disabled: false,
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
            hide: [],
        },
        propertiesOrder: ['company', 'color', 'weight'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['company', 'weight'],
        disabled: false,
    },
    {
        name: 'allProperties',
        displayName: 'כל השדות',
        category: {
            name: 'things',
        },
        properties: {
            type: 'object',
            properties: {
                text: {
                    title: 'טקסט',
                    type: 'string',
                },
                number: {
                    title: 'מספר',
                    type: 'number',
                },
                boolean: {
                    title: 'בוליאני',
                    type: 'boolean',
                },
                date: {
                    title: 'תאריך',
                    type: 'string',
                    format: 'date',
                },
                dateTime: {
                    title: 'תאריך ושעה',
                    type: 'string',
                    format: 'date-time',
                },
                mail: {
                    title: 'כתובת מייל',
                    type: 'string',
                    format: 'email',
                },
                multiEnum: {
                    title: 'רשימה מרובה',
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
                    },
                    minItems: 1,
                    uniqueItems: true,
                },
                enum: {
                    title: 'רשימה',
                    type: 'string',
                    enum: ['אא', 'בב', 'גג', 'דד'],
                },
                location: {
                    title: 'מיקום',
                    type: 'string',
                    format: 'location',
                },
                regex: {
                    title: 'תבנית',
                    type: 'string',
                    pattern: '^0[2-9]\\d-\\d{4}-\\d{3}$',
                    patternCustomErrorMessage: 'יש להזין בפורמט מס טלפון בלבד (050-1234-123)',
                },
                signature: {
                    title: 'חתימה',
                    type: 'string',
                    format: 'signature',
                    archive: false,
                },
                comment: {
                    title: 'הערה-comment',
                    type: 'string',
                    format: 'comment',
                    archive: false,
                    color: '#4752B6',
                    comment: '<p>שלומות!!!</p>',
                },
                textArea: {
                    title: 'טקסט ארוך',
                    type: 'string',
                    format: 'text-area',
                },
                user: {
                    title: 'משתמש',
                    type: 'string',
                    format: 'user',
                    archive: false,
                },
                users: {
                    title: 'משתמשים',
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'user',
                    },
                    minItems: 1,
                    archive: false,
                    uniqueItems: true,
                },
                file: {
                    title: 'קובץ יחיד',
                    type: 'string',
                    format: 'fileId',
                },
                files: {
                    title: 'קבצים מרובים',
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'fileId',
                    },
                    minItems: 1,
                },
            },
            hide: [],
        },
        propertiesOrder: [
            'text',
            'number',
            'boolean',
            'date',
            'dateTime',
            'mail',
            'multiEnum',
            'enum',
            'location',
            'regex',
            'signature',
            'comment',
            'textArea',
            'user',
            'users',
            'file',
            'files',
        ],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        disabled: false,
        documentTemplatesIds: [],
        mapSearchProperties: [],
    },
    {
        name: 'katalog',
        displayName: 'קטלוג',
        category: {
            name: 'azarim',
        },
        properties: {
            type: 'object',
            properties: {
                makat: {
                    type: 'string',
                    title: 'מקט',
                },
                zira: {
                    type: 'string',
                    title: 'זירה',
                },
                pageName: {
                    type: 'string',
                    title: 'שם גיליון',
                },
                helpCategory: {
                    type: 'string',
                    title: 'קטגורית עזר',
                },
                family: {
                    type: 'string',
                    title: 'משפחה',
                    enum: ['קו אפור', 'קו אדום', 'קו סגול'],
                },
                scale: {
                    type: 'string',
                    title: 'סקלה',
                    enum: ['1:20,000', '1:10,000', '1:5,000', '1:50,000'],
                },
                polygon: {
                    type: 'string',
                    title: 'פוליגון',
                    format: 'location',
                },
                availableCount: {
                    type: 'number',
                    title: 'מספר זמין',
                },
            },
            hide: [],
        },
        propertiesOrder: ['makat', 'zira', 'pageName', 'helpCategory', 'family', 'scale', 'polygon', 'availableCount'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['makat', 'zira', 'pageName', 'helpCategory', 'family', 'scale', 'polygon', 'availableCount'],
        disabled: false,
    },
    {
        name: 'requests',
        displayName: 'בקשות',
        category: {
            name: 'azarim',
        },
        properties: {
            type: 'object',
            properties: {
                orderNumber: {
                    type: 'string',
                    title: 'מספר הזמנה',
                },
                forUnit: {
                    type: 'string',
                    title: 'ליחידה',
                },
                orderedBy: {
                    type: 'string',
                    title: 'הוזמן על ידי',
                },
                family: {
                    type: 'string',
                    title: 'משפחה',
                    enum: ['קו אפור', 'קו אדום', 'קו סגול'],
                },
                scale: {
                    type: 'string',
                    title: 'סקלה',
                    enum: ['1:20,000', '1:10,000', '1:5,000', '1:50,000'],
                },
                pageName: {
                    type: 'string',
                    title: 'שם גיליון',
                },
                amount: {
                    type: 'number',
                    title: 'כמות',
                },
                orderStatus: {
                    type: 'string',
                    title: 'סטטוס בקשה',
                    enum: ['הועבר לטיפול', 'חדש', 'מוכן למסירה', 'לוקט', 'נמסר - טופל'],
                },
            },
            hide: [],
        },
        propertiesOrder: ['orderNumber', 'forUnit', 'orderedBy', 'family', 'scale', 'pageName', 'amount', 'orderStatus'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['orderNumber', 'forUnit', 'orderedBy', 'family', 'scale', 'pageName', 'amount', 'orderStatus'],
        disabled: false,
    },
];

export default entityTemplates;
