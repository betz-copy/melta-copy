import { ClientSession, connection } from 'mongoose';

export const transaction = async <T, Func extends (session: ClientSession) => Promise<T>>(func: Func): Promise<T> => {
    let ret: T | undefined;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret!;
};
