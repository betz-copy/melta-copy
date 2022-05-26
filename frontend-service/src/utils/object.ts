export const uniqByFunction = <T>(arr: T[], compareFn: (item1: T, item2: T) => boolean) => {
    return arr.filter((v, i, a) => a.findIndex((v2) => compareFn(v, v2)) === i);
};

export const objectFilter = <T extends object, Func extends (key: string, value: T[keyof T]) => any>(obj: T, func: Func) => {
    return Object.fromEntries(Object.entries(obj).filter(([key, value]) => func(key, value))) as T;
};

export const objectMap = <T extends object, Func extends (key: string, value: T[keyof T]) => any>(
    obj: T,
    func: Func,
): Record<string, ReturnType<Func>> => {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, func(key, value)]));
};
