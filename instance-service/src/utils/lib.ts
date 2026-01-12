import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { Awaited } from '@packages/common';
import { isEqual, isEqualWith, isObject, pickBy } from 'lodash';

export const promisePipe = promisify(pipeline);

export const isBoolean = (value: string) => value === 'true' || value === 'false';

export const tryCatch = async <Func extends (...args: unknown[]) => unknown>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err) {
        return { err };
    }
};

export const arraysEqualsNonOrdered = (arr1: string[], arr2: string[]) => {
    return isEqual(arr1.sort(), arr2.sort());
};

type IsEqualCustomizer = Parameters<typeof isEqualWith>[2];
const isEqualCustomizerStripUndefined: IsEqualCustomizer = (a, b) => {
    // returning undefined means to do default behaviour of isEqual
    if (Array.isArray(a) || Array.isArray(b)) return undefined;
    if (!isObject(a) || !isObject(b)) return undefined;

    let doesIncludeUndefined = false;
    const aStrippedOfUndefined = pickBy(a, (value) => {
        if (value !== undefined) return true;

        doesIncludeUndefined = true;
        return false;
    });
    const bStrippedOfUndefined = pickBy(b, (value) => {
        if (value !== undefined) return true;

        doesIncludeUndefined = true;
        return false;
    });

    if (!doesIncludeUndefined) return undefined;

    return isEqualWith(aStrippedOfUndefined, bStrippedOfUndefined, isEqualCustomizerStripUndefined);
};

// biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
export const isEqualStripUndefined = (a: any, b: any) => {
    return isEqualWith(a, b, isEqualCustomizerStripUndefined);
};
