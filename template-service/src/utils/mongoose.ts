import { forEach } from 'lodash';
import { ClientSession, startSession, Types } from 'mongoose';
import { tryCatch } from '.';

// biome-ignore lint/suspicious/noExplicitAny: lol
export const withTransaction = async <Func extends (session: ClientSession) => Promise<any>>(func: Func): Promise<Awaited<ReturnType<Func>>> => {
    const session = await startSession();
    // biome-ignore lint/suspicious/noImplicitAnyLet: to avoid build errors
    let ret;

    try {
        await session.withTransaction(async () => {
            ret = await func(session);
        });
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
        res.forEach((doc) => {
            transformObjectIdKeysToString(doc);
        });
        return;
    }

    transformObjectIdKeysToString(res);
};
