import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

export const promisePipe = promisify(pipeline);

export const trycatch = async <Func extends (...args: any[]) => any>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err) {
        return { err };
    }
};

export const escapeRegExp = (text: string) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
