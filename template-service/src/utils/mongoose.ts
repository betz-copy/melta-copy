import { ServiceError } from '@microservices/shared';
import { forEach } from 'lodash';
import { ClientSession, startSession, Types } from 'mongoose';
import { trycatch } from '.';

export const withTransaction = async <Func extends (session: ClientSession) => Promise<any>>(func: Func): Promise<Awaited<ReturnType<Func>>> => {
    const session = await startSession();

    try {
        let ret: any;
        await session.withTransaction(async () => {
            ret = await func(session);
        });
        return ret;
    } finally {
        const { err: endSessionErr } = await trycatch(() => session.endSession());
        if (endSessionErr) throw new ServiceError(undefined, 'failed to end session. possible resource leak', { error: endSessionErr });
    }
};

export const transformObjectIdKeysToString = (doc: any) => {
    forEach(doc, (val, key) => {
        if (val instanceof Types.ObjectId) {
            doc[key] = val.toString();
        }
    });
};

export const transformResultDocsObjectIdKeysToString = (res: any | any[]) => {
    if (Array.isArray(res)) {
        res.forEach((doc) => transformObjectIdKeysToString(doc));
        return;
    }

    transformObjectIdKeysToString(res);
};
