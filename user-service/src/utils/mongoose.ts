import { ClientSession, connection } from 'mongoose';

export const transaction = async <Func extends (session: ClientSession) => Promise<any>>(func: Func): Promise<Awaited<ReturnType<Func>>> => {
    // biome-ignore lint/suspicious/noImplicitAnyLet: to avoid build error
    let ret;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret;
};
