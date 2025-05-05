/* eslint-disable no-param-reassign */
import _forEach from 'lodash.foreach';
import { ClientSession, startSession, Types } from 'mongoose';
import { ServiceError } from '@microservices/shared';
import { trycatch } from '.';

export const withTransaction = async <Func extends (session: ClientSession) => Promise<any>>(func: Func): Promise<Awaited<ReturnType<Func>>> => {
    const session = await startSession();

    try {
        let ret;
        await session.withTransaction(async () => {
            ret = await func(session);
        });
        return ret;
    } finally {
        const { err: endSessionErr } = await trycatch(() => session.endSession());
        if (endSessionErr) {
            // eslint-disable-next-line no-unsafe-finally
            throw new ServiceError(undefined, 'failed to end session. possible resource leak', { error: endSessionErr });
        }
    }
};

export const transformObjectIdKeysToString = (doc: any) => {
    _forEach(doc, (val, key) => {
        if (val instanceof Types.ObjectId) {
            // eslint-disable-next-line no-param-reassign
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
