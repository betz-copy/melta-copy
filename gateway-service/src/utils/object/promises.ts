import { Awaited } from '@packages/common';

export const objectMap = async <T extends object, Func extends (key: string, value: T[keyof T]) => Promise<any>>(
    obj: T,
    func: Func,
): Promise<Record<string, Awaited<ReturnType<Func>>>> => {
    const entriesPromises = Object.entries(obj).map(async ([key, value]) => {
        const result = await func(key, value);
        return [key, result];
    });
    const entries = await Promise.all(entriesPromises);
    return Object.fromEntries(entries);
};

export const objectFilter = async <T extends object, Func extends (key: string, value: T[keyof T]) => any, Result extends object = T>(
    obj: T,
    func: Func,
): Promise<Result> => {
    const entriesPromises = Object.entries(obj).map(async ([key, value]) => {
        const result = await func(key, value);
        return [key, result];
    });
    const entries = await Promise.all(entriesPromises);
    const entriesFiltered = entries.filter(([_key, result]) => result);
    return Object.fromEntries(entriesFiltered);
};
