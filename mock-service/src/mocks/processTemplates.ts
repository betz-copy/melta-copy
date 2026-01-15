import { PropertyType } from '@packages/entity-template';
import { ICreateProcessTemplateBody, ProcessPropertyFormats } from '@packages/process';

const getProcessTemplateToCreate = (userIds: string[], chance: Chance.Chance) => {
    const processTemplates: ICreateProcessTemplateBody[] = [
        {
            name: 'createNewWeapon',
            displayName: 'יצירת נשק חדש',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        weapon: {
                            title: 'אמצעיי לחימה',
                            type: PropertyType.string,
                        },
                        payment: {
                            title: 'תשלום',
                            type: PropertyType.string,
                        },
                        weaponsFile: {
                            title: 'קובץ הנשק',
                            type: PropertyType.string,
                            format: 'fileId' as ProcessPropertyFormats,
                        },
                    },
                    required: ['weaponsFile'],
                },
                propertiesOrder: ['weapon', 'payment', 'weaponsFile'],
            },
            steps: [
                {
                    name: 'weaponModel',
                    displayName: 'מודל הנשק',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            weaponName: {
                                title: 'שם הנשק',
                                type: PropertyType.string,
                            },
                            weight: {
                                title: 'משקל',
                                type: PropertyType.number,
                            },
                            length: {
                                title: 'אורך',
                                type: PropertyType.number,
                            },
                            sketch: {
                                title: 'סקיצה',
                                type: PropertyType.string,
                                format: 'fileId' as ProcessPropertyFormats,
                            },
                        },
                        required: ['weaponName'],
                    },
                    propertiesOrder: ['weaponName', 'weight', 'length', 'sketch'],
                },
                {
                    name: 'payment',
                    displayName: 'תשלום',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            amount: {
                                title: 'סכום',
                                type: PropertyType.number,
                            },
                            paymentMethod: {
                                enum: ['אשראי', 'מזומן', `צ'ק`],
                                title: 'סוג תשלום',
                                type: PropertyType.string,
                            },
                            numberOfPayments: {
                                title: 'מספר תשלומים',
                                type: PropertyType.number,
                            },
                        },
                        required: [],
                    },
                    propertiesOrder: ['amount', 'paymentMethod', 'numberOfPayments'],
                },
                {
                    name: 'use',
                    displayName: 'שימוש',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            frequency: {
                                title: 'תדירות שימוש (מספר ימים בשבוע)',
                                type: PropertyType.number,
                            },
                            typeOfUse: {
                                enum: ['מבצעי', 'אימונים', `מלחמה`],
                                title: 'סוג שימוש',
                                type: PropertyType.string,
                            },
                            typeOfBullets: {
                                title: 'סוג כדורים',
                                type: PropertyType.string,
                            },
                        },
                        required: [],
                    },
                    propertiesOrder: ['frequency', 'typeOfUse', 'typeOfBullets'],
                },
            ],
        },
        {
            name: 'bookFlight',
            displayName: 'הזמנת טיסה',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        destination: {
                            title: 'יעד',
                            type: PropertyType.string,
                        },
                        travelDocument: {
                            title: 'מסמך נסיעה',
                            type: PropertyType.string,
                            format: 'fileId' as ProcessPropertyFormats,
                        },
                    },
                    required: [],
                },
                propertiesOrder: ['destination', 'travelDocument'],
            },
            steps: [
                {
                    name: 'flightSelection',
                    displayName: 'בחירת טיסה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            airline: {
                                title: 'חברת תעופה',
                                type: PropertyType.string,
                            },
                            departureTime: {
                                title: 'שעת יציאה',
                                type: PropertyType.string,
                                format: 'date-time' as ProcessPropertyFormats,
                            },
                            arrivalTime: {
                                title: 'שעת נחיתה',
                                type: PropertyType.string,
                                format: 'date-time' as ProcessPropertyFormats,
                            },
                            flightNumber: {
                                title: 'מספר טיסה',
                                type: PropertyType.string,
                            },
                        },
                        required: [],
                    },
                    propertiesOrder: ['airline', 'departureTime', 'arrivalTime', 'flightNumber'],
                },
                {
                    name: 'flightPayment',
                    displayName: 'טיסה תשלום',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            amount: {
                                title: 'סכום',
                                type: PropertyType.number,
                            },
                            paymentMethod: {
                                enum: ['אשראי', 'מזומן', `צ'ק`],
                                title: 'סוג תשלום',
                                type: PropertyType.string,
                            },
                            numberOfPayments: {
                                title: 'מספר תשלומים',
                                type: PropertyType.number,
                            },
                        },
                        required: ['paymentMethod'],
                    },
                    propertiesOrder: ['amount', 'paymentMethod', 'numberOfPayments'],
                },
                {
                    name: 'travelInsurance',
                    displayName: 'ביטוח נסיעה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            insuranceProvider: {
                                title: 'ספק ביטוח',
                                type: PropertyType.string,
                            },
                            coverageAmount: {
                                title: 'סכום כיסוי',
                                type: PropertyType.number,
                            },
                            insurancePolicy: {
                                title: 'מדיניות ביטוח',
                                type: PropertyType.string,
                                format: 'fileId' as ProcessPropertyFormats,
                            },
                        },
                        required: [],
                    },
                    propertiesOrder: ['insuranceProvider', 'coverageAmount', 'insurancePolicy'],
                },
            ],
        },
        {
            name: 'makePizza',
            displayName: 'הכנת פיצה',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        pizzaSize: {
                            title: 'גודל הפיצה',
                            type: PropertyType.string,
                        },
                        crustType: {
                            title: 'סוג בצק',
                            type: PropertyType.string,
                        },
                        orderID: {
                            title: 'מספר הזמנה',
                            type: PropertyType.string,
                        },
                    },
                    required: ['crustType'],
                },
                propertiesOrder: ['pizzaSize', 'crustType', 'orderID'],
            },
            steps: [
                {
                    name: 'prepareCrust',
                    displayName: 'הכנת הבצק',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            flourType: {
                                title: 'סוג קמח',
                                type: PropertyType.string,
                            },
                            waterAmount: {
                                title: 'כמות מים',
                                type: PropertyType.number,
                            },
                            crustThickness: {
                                title: 'עובי הבצק',
                                type: PropertyType.number,
                            },
                        },
                        required: ['crustThickness'],
                    },
                    propertiesOrder: ['flourType', 'waterAmount', 'crustThickness'],
                },
                {
                    name: 'addToppings',
                    displayName: 'הוספת תוספות',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            sauceType: {
                                title: 'סוג רוטב',
                                type: PropertyType.string,
                            },
                            cheeseType: {
                                title: 'סוג גבינה',
                                type: PropertyType.string,
                            },
                            toppings: {
                                title: 'תוספות',
                                type: PropertyType.string,
                                enum: ['זיתים, פטריות, טונה, תירס, אקסטרה גבינה'],
                            },
                        },
                        required: ['sauceType'],
                    },
                    propertiesOrder: ['sauceType', 'cheeseType', 'toppings'],
                },
                {
                    name: 'bakePizza',
                    displayName: 'אפית הפיצה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            ovenTemperature: {
                                title: 'טמפרטורת התנור',
                                type: PropertyType.number,
                            },
                            bakingTime: {
                                title: 'זמן אפיה',
                                type: PropertyType.number,
                            },
                        },
                        required: ['ovenTemperature'],
                    },
                    propertiesOrder: ['ovenTemperature', 'bakingTime'],
                },
            ],
        },
        {
            name: 'transferMoney',
            displayName: 'העברת כסף',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        senderAccount: {
                            title: 'חשבון השולח',
                            type: PropertyType.string,
                        },
                        recipientAccount: {
                            title: 'חשבון המקבל',
                            type: PropertyType.string,
                        },
                        transferAmount: {
                            title: 'סכום ההעברה',
                            type: PropertyType.number,
                        },
                    },
                    required: ['recipientAccount'],
                },
                propertiesOrder: ['senderAccount', 'recipientAccount', 'transferAmount'],
            },
            steps: [
                {
                    name: 'verifySender',
                    displayName: 'אימות השולח',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            senderBank: {
                                title: 'בנק השולח',
                                type: PropertyType.string,
                            },
                            senderCountry: {
                                title: 'ארץ השולח',
                                type: PropertyType.string,
                            },
                            senderID: {
                                title: 'מספר זיהוי השולח',
                                type: PropertyType.string,
                            },
                        },
                        required: ['senderID'],
                    },
                    propertiesOrder: ['senderBank', 'senderCountry', 'senderID'],
                },
                {
                    name: 'verifyRecipient',
                    displayName: 'אימות המקבל',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            recipientBank: {
                                title: 'בנק המקבל',
                                type: PropertyType.string,
                            },
                            recipientCountry: {
                                title: 'ארץ המקבל',
                                type: PropertyType.string,
                            },
                            recipientID: {
                                title: 'מספר זיהוי המקבל',
                                type: PropertyType.string,
                            },
                        },
                        required: ['recipientID'],
                    },
                    propertiesOrder: ['recipientBank', 'recipientCountry', 'recipientID'],
                },
                {
                    name: 'processTransfer',
                    displayName: 'ביצוע ההעברה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            transferFee: {
                                title: 'עמלת העברה',
                                type: PropertyType.number,
                            },
                            exchangeRate: {
                                title: 'שער חליפין',
                                type: PropertyType.number,
                            },
                            transferTime: {
                                title: 'זמן העברה',
                                type: PropertyType.number,
                            },
                        },
                        required: ['transferTime'],
                    },
                    propertiesOrder: ['transferFee', 'exchangeRate', 'transferTime'],
                },
                {
                    name: 'moreStep',
                    displayName: 'עוד שלב',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            someNumber: {
                                title: 'מספר כלשהו',
                                type: PropertyType.number,
                            },
                            anotherSomeNumber: {
                                title: 'עוד מספר כלשהו',
                                type: PropertyType.number,
                            },
                            thirdNumber: {
                                title: 'מספר כלשהו שלישי',
                                type: PropertyType.number,
                            },
                        },
                        required: ['anotherSomeNumber'],
                    },
                    propertiesOrder: ['someNumber', 'anotherSomeNumber', 'thirdNumber'],
                },
            ],
        },
        {
            name: 'publishNewBook',
            displayName: 'פרסום ספר חדש',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        bookTitle: {
                            title: 'שם הספר',
                            type: PropertyType.string,
                        },
                        author: {
                            title: 'המחבר',
                            type: PropertyType.string,
                        },
                        manuscriptFile: {
                            title: 'קובץ התסריט',
                            type: PropertyType.string,
                            format: 'fileId' as ProcessPropertyFormats,
                        },
                    },
                    required: ['manuscriptFile'],
                },
                propertiesOrder: ['bookTitle', 'author', 'manuscriptFile'],
            },
            steps: [
                // Existing steps are modified to fit the new process.
                {
                    name: 'manuscriptReview',
                    displayName: 'ביקורת תסריט',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            reviewerComments: {
                                title: 'הערות המבקר',
                                type: PropertyType.string,
                            },
                            isApproved: {
                                title: 'אישור לפרסום',
                                type: PropertyType.boolean,
                            },
                        },
                        required: ['isApproved'],
                    },
                    propertiesOrder: ['reviewerComments', 'isApproved'],
                },
                // New steps for the book publication process.
                {
                    name: 'copyEditing',
                    displayName: 'עריכת עותק',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            editorName: {
                                title: 'שם העורך',
                                type: PropertyType.string,
                            },
                            editingComplete: {
                                title: 'האם העריכה הסתיימה',
                                type: PropertyType.boolean,
                            },
                        },
                        required: ['editorName'],
                    },
                    propertiesOrder: ['editorName', 'editingComplete'],
                },
                {
                    name: 'coverDesign',
                    displayName: 'עיצוב כריכה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            designerName: {
                                title: 'שם המעצב',
                                type: PropertyType.string,
                            },
                            designApproved: {
                                title: 'אישור העיצוב',
                                type: PropertyType.boolean,
                            },
                        },
                        required: ['designApproved'],
                    },
                    propertiesOrder: ['designerName', 'designApproved'],
                },
                {
                    name: 'print',
                    displayName: 'הדפסה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            numberOfCopies: {
                                title: 'מספר העותקים',
                                type: PropertyType.number,
                            },
                        },
                        required: [],
                    },
                    propertiesOrder: ['numberOfCopies'],
                },
                {
                    name: 'distribution',
                    displayName: 'הפצה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            numberOfLocations: {
                                title: 'מספר מקומות הפצה',
                                type: PropertyType.number,
                            },
                        },
                        required: ['numberOfLocations'],
                    },
                    propertiesOrder: ['numberOfLocations'],
                },
            ],
        },
        {
            name: 'launchSpaceMission',
            displayName: 'השקת משימה לחלל',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        missionName: {
                            title: 'שם המשימה',
                            type: PropertyType.string,
                        },
                        missionObjective: {
                            title: 'מטרת המשימה',
                            type: PropertyType.string,
                        },
                        missionDuration: {
                            title: 'משך המשימה (בימים)',
                            type: PropertyType.number,
                        },
                    },
                    required: ['missionDuration'],
                },
                propertiesOrder: ['missionName', 'missionObjective', 'missionDuration'],
            },
            steps: [
                {
                    name: 'missionPlan',
                    displayName: 'תכנון משימה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            planDetails: {
                                title: 'פרטי התוכנית',
                                type: PropertyType.string,
                            },
                        },
                        required: ['planDetails'],
                    },
                    propertiesOrder: ['planDetails'],
                },
                {
                    name: 'spacecraftDesign',
                    displayName: 'עיצוב החללית',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            designDetails: {
                                title: 'פרטי העיצוב',
                                type: PropertyType.string,
                            },
                        },
                        required: ['designDetails'],
                    },
                    propertiesOrder: ['designDetails'],
                },
                {
                    name: 'crewSelection',
                    displayName: 'בחירת הצוות',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            crewMembers: {
                                title: 'חברי הצוות',
                                type: PropertyType.string,
                            },
                        },
                        required: ['crewMembers'],
                    },
                    propertiesOrder: ['crewMembers'],
                },
                {
                    name: 'launchPreparation',
                    displayName: 'הכנה להשקה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            preparationDetails: {
                                title: 'פרטי ההכנה',
                                type: PropertyType.string,
                            },
                        },
                        required: ['preparationDetails'],
                    },
                    propertiesOrder: ['preparationDetails'],
                },
                {
                    name: 'launch',
                    displayName: 'השקה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            launchTime: {
                                title: 'שעת ההשקה',
                                type: PropertyType.string,
                            },
                        },
                        required: ['launchTime'],
                    },
                    propertiesOrder: ['launchTime'],
                },
                {
                    name: 'missionOperation',
                    displayName: 'הפעלת משימה',
                    reviewers: [chance.pickone(userIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            operationDetails: {
                                title: 'פרטי ההפעלה',
                                type: PropertyType.string,
                            },
                        },
                        required: ['operationDetails'],
                    },
                    propertiesOrder: ['operationDetails'],
                },
            ],
        },
    ];
    return processTemplates;
};

export default getProcessTemplateToCreate;
