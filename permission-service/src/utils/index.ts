import { promisify } from 'util';

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export const trycatch = async <Func extends (...args: any[]) => any>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err) {
        return { err };
    }
};

export const sleep = promisify(setTimeout);
