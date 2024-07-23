<<<<<<<< HEAD:template-service/src/utils/mongo/mongoose.ts
/* eslint-disable no-param-reassign */
import * as _forEach from 'lodash.foreach';
import { ClientSession, startSession, Types } from 'mongoose';
import { trycatch } from '..';
========
import { ClientSession, startSession, Types } from 'mongoose';
import _forEach from 'lodash.foreach';
import { trycatch } from '.';
import logger from './logger/logsLogger';
>>>>>>>> origin/master:template-service/src/utils/mongoose.ts

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
            logger.error('failed to end session. possible resource leak', { error: endSessionErr });
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
