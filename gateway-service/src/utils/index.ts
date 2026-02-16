import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { Awaited } from '@packages/common';
import { isEqual } from 'lodash';

export const promisePipe = promisify(pipeline);

export const tryCatch = async <Func extends (...args: unknown[]) => unknown>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err) {
        return { err };
    }
};

export const filteredMap = <T, V>(arr: T[], func: (value: T) => { include: true; value: V } | { include: false; value?: V }) => {
    const newArr: V[] = [];

    for (let i = 0; i < arr.length; i++) {
        const { include, value } = func(arr[i]);

        if (include) newArr.push(value);
    }

    return newArr;
};

// biome-ignore lint/suspicious/noExplicitAny: seems fine
export const objectContains = <T extends object>(obj: T, subObj: any) => {
    for (const key in subObj) {
        if (!isEqual(obj[key], subObj[key])) return false;
    }

    return true;
};

export const typedObjectEntries = <T extends object>(obj: T): [keyof T, T[keyof T]][] => {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
};

export const isProfileFileType = (profilePath: string): boolean => {
    return !!profilePath && profilePath !== '' && profilePath !== 'kartoffelProfile';
};
