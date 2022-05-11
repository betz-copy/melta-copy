export const uniqByFunction = <T>(arr: T[], compareFn: (item1: T, item2: T) => boolean) => {
    return arr.filter((v, i, a) => a.findIndex((v2) => compareFn(v, v2)) === i);
};
