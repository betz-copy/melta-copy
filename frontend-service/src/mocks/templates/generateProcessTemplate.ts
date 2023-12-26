import { generateMongoId, generateUser } from '../permissions';
import { IMongoProcessTemplatePopulated, IProcessSingleProperty } from '../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../interfaces/processes/stepTemplate';

const generateRandomString = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const hebrewWords = [
    'העברת כספים',
    'למידה בזום, למידה עצמאית כן למידה שם ארוך ארוך',
    'יצירת ישות',
    'חדשנות',
    'אמצעיי לחימה',
    'פיתוח',
    'פרויקט',
    'אינטרנט',
];

const getRandomHebrewWord = () => {
    const randomIndex = Math.floor(Math.random() * hebrewWords.length);
    return hebrewWords[randomIndex];
};

const randomNum2To5 = () => {
    return Math.floor(Math.random() * 4) + 10;
};
const generateProperties = (): { properties: Record<string, IProcessSingleProperty>; propertiesOrder: string[] } => {
    const propertiesCount = randomNum2To5();
    const properties: Record<string, IProcessSingleProperty> = {};
    const propertiesOrder: string[] = [];

    for (let i = 0; i < propertiesCount; i++) {
        const propertyKey = generateRandomString(6);
        properties[propertyKey] = {
            title: getRandomHebrewWord(),
            type: 'string',
        };
        propertiesOrder.push(propertyKey);
    }

    return { properties, propertiesOrder };
};

const generateStepTemplatePopulated = (): IMongoStepTemplatePopulated => {
    const stepName = generateRandomString(6);
    const { properties, propertiesOrder } = generateProperties();

    return {
        _id: generateMongoId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        name: stepName,
        displayName: getRandomHebrewWord(),
        reviewers: Array.from({ length: randomNum2To5() }, () => generateUser()),
        iconFileId: null,
        properties: {
            type: 'object',
            properties,
            required: [],
        },
        propertiesOrder,
    };
};

export const generateProcessTemplatePopulated = (): IMongoProcessTemplatePopulated => {
    const processName = generateRandomString(6);
    const { properties: detailsProperties, propertiesOrder: detailsPropertiesOrder } = generateProperties();

    return {
        _id: generateMongoId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        name: processName,
        displayName: getRandomHebrewWord(),
        details: {
            properties: {
                type: 'object',
                properties: detailsProperties,
                required: [],
            },
            propertiesOrder: detailsPropertiesOrder,
        },
        steps: Array.from({ length: randomNum2To5() }, () => generateStepTemplatePopulated()),
    };
};
