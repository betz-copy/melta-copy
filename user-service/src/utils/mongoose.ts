import { ClientSession, connection } from 'mongoose';

// eslint-disable-next-line import/prefer-default-export
export const transaction = async <T, F extends (session: ClientSession) => Promise<T>>(func: F): Promise<T> => {
    let ret;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret;
};
