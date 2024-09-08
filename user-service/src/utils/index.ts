export const typedObjectEntries = <T extends Object>(obj: T): [keyof T, T[keyof T]][] => {
    return Object.entries(obj) as any;
};

export const flattenObject = (obj: Record<string, any>, path: string[] = []): Record<string, any> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const newPath = [...path, key];

        if (typeof value === 'object' && value !== null) {
            return { ...acc, ...flattenObject(value, newPath) };
        }

        return { ...acc, [newPath.join('.')]: value };
    }, {});
};
