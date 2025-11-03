/* eslint-disable no-plusplus */

import { Awaited } from '@microservices/shared';
import lodashIsEqual from 'lodash.isequal';
import { pipeline } from 'stream';
import { promisify } from 'util';

// eslint-disable-next-line import/prefer-default-export
export const promisePipe = promisify(pipeline);

export const trycatch = async <Func extends (...args: any[]) => any>(func: Func, ...args: Parameters<Func>) => {
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

        if (include) {
            newArr.push(value);
        }
    }

    return newArr;
};

export const objectContains = <T extends Object>(obj: T, subObj: any) => {
    for (const key in subObj) {
        if (!lodashIsEqual(obj[key], subObj[key])) {
            return false;
        }
    }

    return true;
};

export const typedObjectEntries = <T extends Object>(obj: T): [keyof T, T[keyof T]][] => {
    return Object.entries(obj) as any;
};

export const isProfileFileType = (profilePath: string): boolean => {
    return !!profilePath && profilePath !== '' && profilePath !== 'kartoffelProfile';
};
