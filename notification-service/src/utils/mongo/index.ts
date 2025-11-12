import { ClientSession, connection } from 'mongoose';

export const transaction = async <T>(func: (session: ClientSession) => Promise<T>): Promise<T> => {
    let ret: T | undefined;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    if (ret === undefined) throw new Error('Transaction did not return a value');
    return ret;
};

export const UPDATE_CREATED_AT = [
    {
        $addFields: {
            createdAt: {
                $ifNull: ['$notificationDate', '$createdAt'],
            },
        },
    },
    {
        $project: {
            notificationDate: 0,
        },
    },
];
