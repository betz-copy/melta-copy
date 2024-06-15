export const typedObjectEntries = <T extends Object>(obj: T): [keyof T, T[keyof T]][] => {
    return Object.entries(obj) as any;
};
