import { Chance } from 'chance';

const chance = new Chance();

export const popRandom = <T>(array: T[]): T | undefined => {
    if (!array.length) return;
    return array.splice(chance.integer({ min: 0, max: array.length - 1 }), 1)[0];
};

export const pickSetIf = <T>(array: T[], count: number, condition: (item: T) => boolean): T[] | undefined => {
    const arrayCopy = [...array];
    let set: T[] = [];

    while (set.length < count && arrayCopy.length) {
        const currItem = popRandom(arrayCopy);
        if (!currItem || !condition(currItem)) continue;

        set.push(currItem);
    }

    if (set.length < count) return;

    return set;
};

export const pickOneIf = <T>(array: T[], condition: (item: T) => boolean): T | undefined => {
    const [item] = pickSetIf(array, 1, condition) || [];
    return item;
};

export const pickRandomSet = <T>(array: T[], min = 1): T[] => {
    if (array.length < min) return [];
    return chance.pickset(array, chance.integer({ min, max: array.length }))!;
};
