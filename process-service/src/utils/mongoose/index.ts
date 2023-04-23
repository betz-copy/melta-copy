import { connection, ClientSession, Types, Model } from 'mongoose';
import { ProcessInstanceDocument } from '../../express/instances/processes/interface';
import { StepInstanceDocument } from '../../express/instances/steps/interface';

export const transaction = async <T, Func extends (session: ClientSession) => Promise<T>>(func: Func): Promise<T> => {
    let ret;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret;
};

export const getTemplateAggregation = async (
    model: Model<ProcessInstanceDocument> | Model<StepInstanceDocument>,
    foreignCollectionName: string,
    id: string,
) => {
    return model.aggregate([
        {
            $match: {
                _id: Types.ObjectId(id),
            },
        },
        {
            $lookup: {
                from: foreignCollectionName,
                let: { templateId: '$templateId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', { $toObjectId: '$$templateId' }],
                            },
                        },
                    },
                ],
                as: 'template',
            },
        },
        {
            $unwind: '$template',
        },
        {
            $replaceRoot: {
                newRoot: '$template',
            },
        },
    ]);
};
