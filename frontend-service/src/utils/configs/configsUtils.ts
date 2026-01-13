import { IValue } from '../../pages/SystemManagement/components/Field';

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// biome-ignore lint/suspicious/noExplicitAny: generic function
export const getDefaultValue = (path: string, defaultObj: any) => {
    const keys = path.split('.');
    let obj = defaultObj;
    for (const key of keys) {
        if (obj[key] !== undefined) {
            obj = obj[key];
        }
    }
    return obj;
};

// biome-ignore lint/suspicious/noExplicitAny: generic function
export const setNestedValue = (obj: any, path: string, value: IValue) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};

        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
};

// biome-ignore lint/suspicious/noExplicitAny: generic function
export const getValueByPath = (obj: any, path: string) => {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current[key] !== undefined) current = current[key];
    }
    return current;
};
