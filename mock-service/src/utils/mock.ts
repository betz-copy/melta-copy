export const popRandom = <T>(chance: Chance.Chance, array: T[]): T | undefined => {
    if (!array.length) return undefined;
    return array.splice(chance.integer({ min: 0, max: array.length - 1 }), 1)[0];
};

export const pickSetIf = <T>(chance: Chance.Chance, array: T[], count: number, condition: (item: T) => boolean): T[] | undefined => {
    const arrayCopy = [...array];
    const set: T[] = [];

    while (set.length < count && arrayCopy.length) {
        const currItem = popRandom(chance, arrayCopy);
        if (!currItem || !condition(currItem)) continue;

        set.push(currItem);
    }

    if (set.length < count) return undefined;

    return set;
};

export const pickOneIf = <T>(chance: Chance.Chance, array: T[], condition: (item: T) => boolean): T | undefined => {
    const [item] = pickSetIf(chance, array, 1, condition) || [];
    return item;
};

export const pickRandomSet = <T>(chance: Chance.Chance, array: T[], min = 1): T[] => {
    if (array.length < min) return [];
    return chance.pickset(array, chance.integer({ min, max: array.length }))!;
};
