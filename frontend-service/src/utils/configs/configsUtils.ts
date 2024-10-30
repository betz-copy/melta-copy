export const deepClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
};

export const getDefaultValue = (path: string, defaultObj: any) => {
    const keys = path.split('.');
    let obj = defaultObj;
    for (const key of keys) {
        if (obj[key] !== undefined) {
            obj = obj[key];
        } else {
            return undefined;
        }
    }
    return obj;
};

export const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
};

export const getValueByPath = (obj: any, path: string) => {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current[key] !== undefined) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return current;
};
