import { pipeline } from 'stream';
import { promisify } from 'util';
import isEqual from 'lodash.isequal';

// eslint-disable-next-line import/prefer-default-export
export const promisePipe = promisify(pipeline);

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export const isBoolean = (value: string) => value === 'true' || value === 'false';

export const trycatch = async <Func extends (...args: any[]) => any>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err) {
        return { err };
    }
};

export const arraysEqualsNonOrdered = (arr1: string[], arr2: string[]) => {
    return isEqual(arr1.sort(), arr2.sort());
};
