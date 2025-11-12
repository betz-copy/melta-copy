import { forEach } from 'lodash';
import { ClientSession, startSession, Types } from 'mongoose';
import { tryCatch } from '.';

export const withTransaction = async <T>(func: (session: ClientSession) => Promise<T>): Promise<T> => {
    const session = await startSession();
    let ret: T | undefined;

    try {
        await session.withTransaction(async () => {
            ret = await func(session);
        });
        if (ret === undefined) throw new Error('Transaction did not return a value');
        return ret;
    } finally {
        const { err: endSessionErr } = await tryCatch(() => session.endSession());
        if (endSessionErr) console.error('Failed to end session. Possible resource leak', endSessionErr);
    }
};

export const transformObjectIdKeysToString = (doc: Record<string, unknown>) => {
    forEach(doc, (val, key) => {
        if (val instanceof Types.ObjectId) {
            doc[key] = val.toString();
        }
    });
};

export const transformResultDocsObjectIdKeysToString = (res: Record<string, unknown> | Record<string, unknown>[]) => {
    if (Array.isArray(res)) {
        res.forEach((doc) => transformObjectIdKeysToString(doc));
        return;
    }

    transformObjectIdKeysToString(res);
};
