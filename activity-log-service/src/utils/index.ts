import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { Awaited } from '@microservices/shared';

export const promisePipe = promisify(pipeline);

export const trycatch = async <Func extends (...args: unknown[]) => unknown>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err: unknown) {
        return { err };
    }
};
