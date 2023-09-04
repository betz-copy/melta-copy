import { IProcessTemplateWithSteps } from '../processTemplate';
import config from '../config';

const { reviewersKartoffelIds } = config.processService;
export const getProcessTemplateToCreate = (chance: Chance.Chance) => {
    const processTemplates: IProcessTemplateWithSteps[] = [
        {
            name: 'createNewWeapon',
            displayName: 'יצירת נשק חדש',
            details: {
                properties: {
                    type: 'object',
                    properties: {
                        weapon: {
                            title: 'אמצעיי לחימה',
                            type: 'string',
                        },
                        payment: {
                            title: 'תשלום',
                            type: 'string',
                        },
                        weaponsFile: {
                            title: 'קובץ הנשק',
                            type: 'string',
                            format: 'fileId',
                        },
                    },
                },
                propertiesOrder: ['weapon', 'payment', 'weaponsFile'],
            },
            steps: [
                {
                    name: 'weaponModel',
                    displayName: 'מודל הנשק',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            weaponName: {
                                title: 'שם הנשק',
                                type: 'string',
                            },
                            weight: {
                                title: 'משקל',
                                type: 'number',
                            },
                            length: {
                                title: 'אורך',
                                type: 'number',
                            },
                            sketch: {
                                title: 'סקיצה',
                                type: 'string',
                                format: 'fileId',
                            },
                        },
                    },
                    propertiesOrder: ['weaponName', 'weight', 'length', 'sketch'],
                },
                {
                    name: 'payment',
                    displayName: 'תשלום',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            amount: {
                                title: 'סכום',
                                type: 'number',
                            },
                            paymentMethod: {
                                enum: ['אשראי', 'מזומן', `צ'ק`],
                                title: 'סוג תשלום',
                                type: 'string',
                            },
                            numberOfPayments: {
                                title: 'מספר תשלומים',
                                type: 'number',
                            },
                        },
                    },
                    propertiesOrder: ['amount', 'paymentMethod', 'numberOfPayments'],
                },
                {
                    name: 'use',
                    displayName: 'שימוש',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            frequency: {
                                title: 'תדירות שימוש (מספר ימים בשבוע)',
                                type: 'number',
                            },
                            typeOfUse: {
                                enum: ['מבצעי', 'אימונים', `מלחמה`],
                                title: 'סוג שימוש',
                                type: 'string',
                            },
                            typeOfBullets: {
                                title: 'סוג כדורים',
                                type: 'string',
                            },
                        },
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
                            type: 'string',
                        },
                        travelDocument: {
                            title: 'מסמך נסיעה',
                            type: 'string',
                            format: 'fileId',
                        },
                    },
                },
                propertiesOrder: ['destination', 'travelDocument'],
            },
            steps: [
                {
                    name: 'flightSelection',
                    displayName: 'בחירת טיסה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            airline: {
                                title: 'חברת תעופה',
                                type: 'string',
                            },
                            departureTime: {
                                title: 'שעת יציאה',
                                type: 'string',
                                format: 'date-time',
                            },
                            arrivalTime: {
                                title: 'שעת נחיתה',
                                type: 'string',
                                format: 'date-time',
                            },
                            flightNumber: {
                                title: 'מספר טיסה',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['airline', 'departureTime', 'arrivalTime', 'flightNumber'],
                },
                {
                    name: 'flightPayment',
                    displayName: 'טיסה תשלום',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            amount: {
                                title: 'סכום',
                                type: 'number',
                            },
                            paymentMethod: {
                                enum: ['אשראי', 'מזומן', `צ'ק`],
                                title: 'סוג תשלום',
                                type: 'string',
                            },
                            numberOfPayments: {
                                title: 'מספר תשלומים',
                                type: 'number',
                            },
                        },
                    },
                    propertiesOrder: ['amount', 'paymentMethod', 'numberOfPayments'],
                },
                {
                    name: 'travelInsurance',
                    displayName: 'ביטוח נסיעה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            insuranceProvider: {
                                title: 'ספק ביטוח',
                                type: 'string',
                            },
                            coverageAmount: {
                                title: 'סכום כיסוי',
                                type: 'number',
                            },
                            insurancePolicy: {
                                title: 'מדיניות ביטוח',
                                type: 'string',
                                format: 'fileId',
                            },
                        },
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
                            type: 'string',
                        },
                        crustType: {
                            title: 'סוג בצק',
                            type: 'string',
                        },
                        orderID: {
                            title: 'מספר הזמנה',
                            type: 'string',
                        },
                    },
                },
                propertiesOrder: ['pizzaSize', 'crustType', 'orderID'],
            },
            steps: [
                {
                    name: 'prepareCrust',
                    displayName: 'הכנת הבצק',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            flourType: {
                                title: 'סוג קמח',
                                type: 'string',
                            },
                            waterAmount: {
                                title: 'כמות מים',
                                type: 'number',
                            },
                            crustThickness: {
                                title: 'עובי הבצק',
                                type: 'number',
                            },
                        },
                    },
                    propertiesOrder: ['flourType', 'waterAmount', 'crustThickness'],
                },
                {
                    name: 'addToppings',
                    displayName: 'הוספת תוספות',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            sauceType: {
                                title: 'סוג רוטב',
                                type: 'string',
                            },
                            cheeseType: {
                                title: 'סוג גבינה',
                                type: 'string',
                            },
                            toppings: {
                                title: 'תוספות',
                                type: 'string',
                                enum: ['זיתים, פטריות, טונה, תירס, אקסטרה גבינה'],
                            },
                        },
                    },
                    propertiesOrder: ['sauceType', 'cheeseType', 'toppings'],
                },
                {
                    name: 'bakePizza',
                    displayName: 'אפית הפיצה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            ovenTemperature: {
                                title: 'טמפרטורת התנור',
                                type: 'number',
                            },
                            bakingTime: {
                                title: 'זמן אפיה',
                                type: 'number',
                            },
                        },
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
                            type: 'string',
                        },
                        recipientAccount: {
                            title: 'חשבון המקבל',
                            type: 'string',
                        },
                        transferAmount: {
                            title: 'סכום ההעברה',
                            type: 'number',
                        },
                    },
                },
                propertiesOrder: ['senderAccount', 'recipientAccount', 'transferAmount'],
            },
            steps: [
                {
                    name: 'verifySender',
                    displayName: 'אימות השולח',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            senderBank: {
                                title: 'בנק השולח',
                                type: 'string',
                            },
                            senderCountry: {
                                title: 'ארץ השולח',
                                type: 'string',
                            },
                            senderID: {
                                title: 'מספר זיהוי השולח',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['senderBank', 'senderCountry', 'senderID'],
                },
                {
                    name: 'verifyRecipient',
                    displayName: 'אימות המקבל',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            recipientBank: {
                                title: 'בנק המקבל',
                                type: 'string',
                            },
                            recipientCountry: {
                                title: 'ארץ המקבל',
                                type: 'string',
                            },
                            recipientID: {
                                title: 'מספר זיהוי המקבל',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['recipientBank', 'recipientCountry', 'recipientID'],
                },
                {
                    name: 'processTransfer',
                    displayName: 'ביצוע ההעברה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            transferFee: {
                                title: 'עמלת העברה',
                                type: 'number',
                            },
                            exchangeRate: {
                                title: 'שער חליפין',
                                type: 'number',
                            },
                            transferTime: {
                                title: 'זמן העברה',
                                type: 'number',
                            },
                        },
                    },
                    propertiesOrder: ['transferFee', 'exchangeRate', 'transferTime'],
                },
                {
                    name: 'moreStep',
                    displayName: 'עוד שלב',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            someNumber: {
                                title: 'מספר כלשהו',
                                type: 'number',
                            },
                            anotherSomeNumber: {
                                title: 'עוד מספר כלשהו',
                                type: 'number',
                            },
                            thirdNumber: {
                                title: 'מספר כלשהו שלישי',
                                type: 'number',
                            },
                        },
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
                            type: 'string',
                        },
                        author: {
                            title: 'המחבר',
                            type: 'string',
                        },
                        manuscriptFile: {
                            title: 'קובץ התסריט',
                            type: 'string',
                            format: 'fileId',
                        },
                    },
                },
                propertiesOrder: ['bookTitle', 'author', 'manuscriptFile'],
            },
            steps: [
                // Existing steps are modified to fit the new process.
                {
                    name: 'manuscriptReview',
                    displayName: 'ביקורת תסריט',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            reviewerComments: {
                                title: 'הערות המבקר',
                                type: 'string',
                            },
                            isApproved: {
                                title: 'אישור לפרסום',
                                type: 'boolean',
                            },
                        },
                    },
                    propertiesOrder: ['reviewerComments', 'isApproved'],
                },
                // New steps for the book publication process.
                {
                    name: 'copyEditing',
                    displayName: 'עריכת עותק',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            editorName: {
                                title: 'שם העורך',
                                type: 'string',
                            },
                            editingComplete: {
                                title: 'האם העריכה הסתיימה',
                                type: 'boolean',
                            },
                        },
                    },
                    propertiesOrder: ['editorName', 'editingComplete'],
                },
                {
                    name: 'coverDesign',
                    displayName: 'עיצוב כריכה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            designerName: {
                                title: 'שם המעצב',
                                type: 'string',
                            },
                            designApproved: {
                                title: 'אישור העיצוב',
                                type: 'boolean',
                            },
                        },
                    },
                    propertiesOrder: ['designerName', 'designApproved'],
                },
                {
                    name: 'print',
                    displayName: 'הדפסה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            numberOfCopies: {
                                title: 'מספר העותקים',
                                type: 'number',
                            },
                        },
                    },
                    propertiesOrder: ['numberOfCopies'],
                },
                {
                    name: 'distribution',
                    displayName: 'הפצה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            numberOfLocations: {
                                title: 'מספר מקומות הפצה',
                                type: 'number',
                            },
                        },
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
                            type: 'string',
                        },
                        missionObjective: {
                            title: 'מטרת המשימה',
                            type: 'string',
                        },
                        missionDuration: {
                            title: 'משך המשימה (בימים)',
                            type: 'number',
                        },
                    },
                },
                propertiesOrder: ['missionName', 'missionObjective', 'missionDuration'],
            },
            steps: [
                {
                    name: 'missionPlan',
                    displayName: 'תכנון משימה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            planDetails: {
                                title: 'פרטי התוכנית',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['planDetails'],
                },
                {
                    name: 'spacecraftDesign',
                    displayName: 'עיצוב החללית',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            designDetails: {
                                title: 'פרטי העיצוב',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['designDetails'],
                },
                {
                    name: 'crewSelection',
                    displayName: 'בחירת הצוות',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            crewMembers: {
                                title: 'חברי הצוות',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['crewMembers'],
                },
                {
                    name: 'launchPreparation',
                    displayName: 'הכנה להשקה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            preparationDetails: {
                                title: 'פרטי ההכנה',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['preparationDetails'],
                },
                {
                    name: 'launch',
                    displayName: 'השקה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            launchTime: {
                                title: 'שעת ההשקה',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['launchTime'],
                },
                {
                    name: 'missionOperation',
                    displayName: 'הפעלת משימה',
                    reviewers: [chance.pickone(reviewersKartoffelIds)],
                    iconFileId: null,
                    properties: {
                        type: 'object',
                        properties: {
                            operationDetails: {
                                title: 'פרטי ההפעלה',
                                type: 'string',
                            },
                        },
                    },
                    propertiesOrder: ['operationDetails'],
                },
            ],
        },
    ];
    return processTemplates;
};
