import { PropertyFormat, PropertyType } from 'shared/dist';
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                destination: {
                    type: PropertyType.string,
                    title: 'יעד',
                },
                startDate: {
                    type: PropertyType.string,
                    title: 'תאריך התחלה',
                    format: PropertyFormat.date,
                },
                endDate: {
                    type: PropertyType.string,
                    title: 'תאריך סיום',
                    format: PropertyFormat.date,
                },
                firstFile: {
                    type: PropertyType.string,
                    title: 'קובץ ראשון',
                    format: PropertyFormat.fileId,
                },
                location: {
                    type: PropertyType.string,
                    title: 'מיקום',
                    format: PropertyFormat.location,
                },
            },
            hide: [],
        },
        propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile', PropertyFormat.location],
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
                    type: PropertyType.string,
                    title: 'שם פרטי',
                },
                lastName: {
                    type: PropertyType.string,
                    title: 'שם משפחה',
                },
                age: {
                    type: PropertyType.number,
                    title: 'גיל',
                },
                gender: {
                    type: PropertyType.boolean,
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
                    type: PropertyType.string,
                    title: 'שם פרטי',
                },
                lastName: {
                    type: PropertyType.string,
                    title: 'שם משפחה',
                },
                age: {
                    type: PropertyType.number,
                    title: 'גיל',
                },
                gender: {
                    type: PropertyType.boolean,
                    title: 'זכר',
                },
                agentId: {
                    type: PropertyType.string,
                    title: 'מזהה סוכן',
                },
                location: {
                    type: PropertyType.string,
                    title: 'מקום מגורים',
                    format: PropertyFormat.location,
                },
            },
            hide: ['lastName'],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId', PropertyFormat.location],
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
                    type: PropertyType.string,
                    title: 'מספר טיסה',
                },
                departureDate: {
                    type: PropertyType.string,
                    title: 'תאריך המראה',
                    format: PropertyFormat['date-time'],
                },
                landingDate: {
                    type: PropertyType.string,
                    title: 'תאריך נחיתה',
                    format: PropertyFormat['date-time'],
                },
                from: {
                    type: PropertyType.string,
                    title: 'מקום המראה',
                },
                to: {
                    type: PropertyType.string,
                    title: 'מקום הנחיתה',
                },
                planeType: {
                    type: PropertyType.string,
                    title: 'סוג המטוס',
                },
                seatType: {
                    type: PropertyType.string,
                    title: 'סוג מושב',
                    enum: ['ביזנס', 'עסקים', 'תיירים פלוס', 'תיירים'],
                },
                location: {
                    type: PropertyType.string,
                    title: 'יעד',
                    format: PropertyFormat.location,
                },
            },
            hide: ['departureDate'],
        },
        propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType', 'seatType', PropertyFormat.location],
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
                    type: PropertyType.string,
                    title: 'מספר טיסה',
                },
                Flighttype: {
                    type: PropertyType.string,
                    title: 'סוג טיסה',
                    enum: ['ביזנס', 'עסקים', 'תיירים'],
                },
                FlightPlatform: {
                    type: PropertyType.string,
                    title: 'פלטפורמת טיסה',
                    enum: ['פלטפורמה א', 'פלטפורמה ב'],
                },
                FlightDepart: {
                    type: PropertyType.string,
                    title: 'מוצא',
                    enum: ['וינה', 'אתונה', 'תל אביב', 'רומא'],
                },
                FlightDest: {
                    type: PropertyType.string,
                    title: 'יעד',
                    enum: ['וינה', 'אתונה', 'תל אביב', 'רומא'],
                },
                FlightDepTime: {
                    type: PropertyType.string,
                    title: 'תאריך המראה',
                    format: PropertyFormat['date-time'],
                },
                FlightArrTime: {
                    type: PropertyType.string,
                    title: 'תאריך נחיתה',
                    format: PropertyFormat['date-time'],
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                airportId: {
                    type: PropertyType.string,
                    title: 'מזהה',
                },
                country: {
                    type: PropertyType.string,
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                hotelChain: {
                    type: PropertyType.string,
                    title: 'שם רשת',
                },
                checkInDate: {
                    type: PropertyType.string,
                    title: 'תאריך הגעה',
                    format: PropertyFormat['date-time'],
                },
                checkOutDate: {
                    type: PropertyType.string,
                    title: 'תאריך עזיבה',
                    format: PropertyFormat['date-time'],
                },
                country: {
                    type: PropertyType.string,
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                checkInDate: {
                    type: PropertyType.string,
                    title: 'תאריך הגעה',
                    format: PropertyFormat['date-time'],
                },
                checkOutDate: {
                    type: PropertyType.string,
                    title: 'תאריך עזיבה',
                    format: PropertyFormat['date-time'],
                },
                country: {
                    type: PropertyType.string,
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                company: {
                    type: PropertyType.string,
                    title: 'חברה',
                },
                expirtaionDate: {
                    type: PropertyType.string,
                    title: 'תאריך פג תוקף',
                    format: PropertyFormat.date,
                },
                monthlyAmount: {
                    type: PropertyType.number,
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
        displayName: "צ'ק",
        category: {
            name: 'money',
        },
        properties: {
            type: 'object',
            properties: {
                name: {
                    type: PropertyType.string,
                    title: 'שם',
                },
                amount: {
                    type: PropertyType.number,
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
                    type: PropertyType.string,
                    title: 'דגם',
                },
                color: {
                    type: PropertyType.string,
                    title: 'צבע',
                },
                serialNumber: {
                    type: PropertyType.string,
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
                    type: PropertyType.string,
                    title: 'חברה',
                },
                number: {
                    type: PropertyType.number,
                    title: 'מספר',
                },
            },
            hide: [],
        },
        propertiesOrder: ['company', PropertyType.number],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['company', PropertyType.number],
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
                    type: PropertyType.string,
                    title: 'חברה',
                },
                color: {
                    type: PropertyType.string,
                    title: 'צבע',
                },
                weight: {
                    type: PropertyType.number,
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
                    type: PropertyType.string,
                },
                number: {
                    title: 'מספר',
                    type: PropertyType.number,
                },
                boolean: {
                    title: 'בוליאני',
                    type: PropertyType.boolean,
                },
                date: {
                    title: 'תאריך',
                    type: PropertyType.string,
                    format: PropertyFormat.date,
                },
                dateTime: {
                    title: 'תאריך ושעה',
                    type: PropertyType.string,
                    format: PropertyFormat['date-time'],
                },
                mail: {
                    title: 'כתובת מייל',
                    type: PropertyType.string,
                    format: PropertyFormat.email,
                },
                multiEnum: {
                    title: 'רשימה מרובה',
                    type: PropertyType.array,
                    items: {
                        type: PropertyType.string,
                        enum: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
                    },
                    minItems: 1,
                    uniqueItems: true,
                },
                enum: {
                    title: 'רשימה',
                    type: PropertyType.string,
                    enum: ['אא', 'בב', 'גג', 'דד'],
                },
                location: {
                    title: 'מיקום',
                    type: PropertyType.string,
                    format: PropertyFormat.location,
                },
                regex: {
                    title: 'תבנית',
                    type: PropertyType.string,
                    pattern: '^0[2-9]\\d-\\d{4}-\\d{3}$',
                    patternCustomErrorMessage: 'יש להזין בפורמט מס טלפון בלבד (050-1234-123)',
                },
                signature: {
                    title: 'חתימה',
                    type: PropertyType.string,
                    format: PropertyFormat.signature,
                    archive: false,
                },
                comment: {
                    title: 'הערה-comment',
                    type: PropertyType.string,
                    format: PropertyFormat.comment,
                    archive: false,
                    color: '#4752B6',
                    comment: '<p>שלומות!!!</p>',
                },
                textArea: {
                    title: 'טקסט ארוך',
                    type: PropertyType.string,
                    format: PropertyFormat['text-area'],
                },
                user: {
                    title: 'משתמש',
                    type: PropertyType.string,
                    format: PropertyFormat.user,
                    archive: false,
                },
                users: {
                    title: 'משתמשים',
                    type: PropertyType.array,
                    items: {
                        type: PropertyType.string,
                        format: PropertyFormat.user,
                    },
                    minItems: 1,
                    archive: false,
                    uniqueItems: true,
                },
                file: {
                    title: 'קובץ יחיד',
                    type: PropertyType.string,
                    format: PropertyFormat.fileId,
                },
                files: {
                    title: 'קבצים מרובים',
                    type: PropertyType.array,
                    items: {
                        type: PropertyType.string,
                        format: PropertyFormat.fileId,
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
                    type: PropertyType.string,
                    title: 'מקט',
                },
                zira: {
                    type: PropertyType.string,
                    title: 'זירה',
                },
                pageName: {
                    type: PropertyType.string,
                    title: 'שם גיליון',
                },
                helpCategory: {
                    type: PropertyType.string,
                    title: 'קטגורית עזר',
                },
                famaly: {
                    type: PropertyType.string,
                    title: 'משפחה',
                    enum: ['קו אפור', 'קו אדום', 'קו סגול'],
                },
                scale: {
                    type: PropertyType.string,
                    title: 'סקלה',
                    enum: ['1:20,000', '1:10,000', '1:5,000', '1:50,000'],
                },
                polygon: {
                    type: PropertyType.string,
                    title: 'פוליגון',
                    format: PropertyFormat.location,
                },
                availableCount: {
                    type: PropertyType.number,
                    title: 'מספר זמין',
                },
            },
            hide: [],
        },
        propertiesOrder: ['makat', 'zira', 'pageName', 'helpCategory', 'famaly', 'scale', 'polygon', 'availableCount'],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: ['makat', 'zira', 'pageName', 'helpCategory', 'famaly', 'scale', 'polygon', 'availableCount'],
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
                    type: PropertyType.string,
                    title: 'מספר הזמנה',
                },
                forUnit: {
                    type: PropertyType.string,
                    title: 'ליחידה',
                },
                orderedBy: {
                    type: PropertyType.string,
                    title: 'הוזמן על ידי',
                },
                family: {
                    type: PropertyType.string,
                    title: 'משפחה',
                    enum: ['קו אפור', 'קו אדום', 'קו סגול'],
                },
                scale: {
                    type: PropertyType.string,
                    title: 'סקלה',
                    enum: ['1:20,000', '1:10,000', '1:5,000', '1:50,000'],
                },
                pageName: {
                    type: PropertyType.string,
                    title: 'שם גיליון',
                },
                amount: {
                    type: PropertyType.number,
                    title: 'כמות',
                },
                orderStatus: {
                    type: PropertyType.string,
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
