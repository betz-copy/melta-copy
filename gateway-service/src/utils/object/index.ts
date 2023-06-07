export const objectMap = <T extends object, Func extends (key: string, value: T[keyof T]) => any>(
    obj: T,
    func: Func,
): Record<string, ReturnType<Func>> => {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, func(key, value)]));
};

export const objectFilter = <T extends object, Func extends (key: string, value: T[keyof T]) => any>(obj: T, func: Func) => {
    return Object.fromEntries(Object.entries(obj).filter(([key, value]) => func(key, value))) as Partial<T>;
};

export const isObjEmpty = (obj: any) => {
    return Object.keys(obj).length === 0;
};
