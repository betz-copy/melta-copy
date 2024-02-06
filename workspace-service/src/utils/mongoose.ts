import mongoose from 'mongoose';

// https://github.com/Automattic/mongoose/issues/7150
export const AllowedEmptyString = mongoose.Schema.Types.String;
AllowedEmptyString.checkRequired((v) => v != null);

export const transaction = async <T, Func extends (session: mongoose.ClientSession) => Promise<T>>(func: Func): Promise<T> => {
    let ret: T | undefined;

    await mongoose.connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret!;
};
