import { ClientSession, startSession } from 'mongoose';
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
            console.log('failed to end session. possible resource leak', endSessionErr);
        }
    }
};
