import { ClientSession, connection } from 'mongoose';

export const transaction = async <T>(func: (session: ClientSession) => Promise<T>): Promise<T> => {
    let ret: T | undefined;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    if (ret === undefined) throw new Error('Transaction did not return a value');
    return ret;
};
