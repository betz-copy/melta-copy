import { logger } from '@microservices/shared';
import { ClientSession, startSession } from 'mongoose';
import { tryCatch } from '..';

export const withTransaction = async <T, Func extends (session: ClientSession) => Promise<T>>(func: Func): Promise<T> => {
    const session = await startSession();

    try {
        let ret: T | undefined;
        await session.withTransaction(async () => {
            ret = await func(session);
        });

        return ret!;
    } finally {
        const { err: endSessionErr } = await tryCatch(() => session.endSession());
        if (endSessionErr) logger.error('failed to end session. possible resource leak', { error: endSessionErr });
    }
};
