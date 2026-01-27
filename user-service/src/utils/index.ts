/** biome-ignore-all lint/suspicious/noExplicitAny: lol */
export const typedObjectEntries = <T extends object>(obj: T): [keyof T, T[keyof T]][] => {
    return Object.entries(obj) as any;
};

export const flattenObject = (obj: Record<string, any>, path: string[] = []): Record<string, any> => {
    const acc: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        const newPath = [...path, key];
        if (typeof value === 'object' && value !== null) Object.assign(acc, flattenObject(value, newPath));
        else acc[newPath.join('.')] = value;
    }
    return acc;
};
