import { ClientSession, connection, Schema } from 'mongoose';

// https://github.com/Automattic/mongoose/issues/7150
export const AllowedEmptyString = Schema.Types.String;
AllowedEmptyString.checkRequired((v) => v != null);

export const transaction = async <T, Func extends (session: ClientSession) => Promise<T>>(func: Func): Promise<T> => {
    let ret: T | undefined;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret!;
};
