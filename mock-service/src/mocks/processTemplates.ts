import { IProcessTemplateWithSteps } from '../processTemplate';

export const processTemplates: IProcessTemplateWithSteps[] = [
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
        summaryDetails: {
            properties: {
                type: 'object',
                properties: {
                    summaryText: {
                        title: 'הודעת סיכום',
                        type: 'string',
                    },
                    finalWeaponName: {
                        title: 'שם נשק סופי',
                        type: 'string',
                    },
                    weaponFinalFile: {
                        title: 'קובץ נשק סופי',
                        type: 'string',
                        format: 'fileId',
                    },
                },
            },
            propertiesOrder: ['finalWeaponName', 'summaryText', 'weaponFinalFile'],
        },
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
        summaryDetails: {
            properties: {
                type: 'object',
                properties: {
                    summaryText: {
                        title: 'הודעת סיכום',
                        type: 'string',
                    },
                    finalFlightDetails: {
                        title: 'פרטי טיסה סופיים',
                        type: 'string',
                    },
                    flightConfirmationFile: {
                        title: 'קובץ אישור טיסה',
                        type: 'string',
                        format: 'fileId',
                    },
                },
            },
            propertiesOrder: ['summaryText', 'finalFlightDetails', 'flightConfirmationFile'],
        },
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
        summaryDetails: {
            properties: {
                type: 'object',
                properties: {
                    summaryText: {
                        title: 'הודעת סיכום',
                        type: 'string',
                    },
                    finalPizzaImage: {
                        title: 'תמונת הפיצה הסופית',
                        type: 'string',
                        format: 'fileId',
                    },
                },
            },
            propertiesOrder: ['summaryText', 'finalPizzaImage'],
        },
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
                reviewers: ['61d37cb5e4de0300121e31ef'],
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
        ],
        summaryDetails: {
            properties: {
                type: 'object',
                properties: {
                    summaryText: {
                        title: 'הודעת סיכום',
                        type: 'string',
                    },
                    finalTransferConfirmation: {
                        title: 'אישור העברה סופי',
                        type: 'string',
                        format: 'fileId',
                    },
                },
            },
            propertiesOrder: ['summaryText', 'finalTransferConfirmation'],
        },
    },
];
