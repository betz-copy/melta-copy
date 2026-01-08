/** biome-ignore-all lint/suspicious/noExplicitAny: never doubt Noam */
export const objectMap = <T extends object, Func extends (key: string, value: T[keyof T]) => any>(
    obj: T,
    func: Func,
): Record<string, ReturnType<Func>> => {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, func(key, value)]));
};

export const objectFilter = <T extends object, Func extends (key: string, value: T[keyof T]) => any, Result extends object = T>(
    obj: T,
    func: Func,
): Result => {
    return Object.fromEntries(Object.entries(obj).filter(([key, value]) => func(key, value))) as Result;
};

export const isObjEmpty = (obj: any) => {
    return !Object.keys(obj).length;
};
