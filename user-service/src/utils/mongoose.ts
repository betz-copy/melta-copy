import { ClientSession, connection } from 'mongoose';

export const transaction = async <T, F extends (session: ClientSession) => Promise<T>>(func: F): Promise<T> => {
    let ret: any;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret;
};
