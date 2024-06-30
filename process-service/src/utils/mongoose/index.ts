import { connection, ClientSession, Types, Model, FilterQuery, startSession } from 'mongoose';
import { ProcessInstanceDocument } from '../../express/instances/processes/interface';
import { StepInstanceDocument } from '../../express/instances/steps/interface';
import ProcessTemplateModel from '../../express/templates/processes/model';
import { IMongoProcessTemplatePopulated, ProcessTemplateDocument } from '../../express/templates/processes/interface';
import config from '../../config';
import ProcessInstanceModel from '../../express/instances/processes/model';
import { trycatch } from '..';
import logger from '../logger/logsLogger';

export const transaction = async <T, Func extends (session: ClientSession) => Promise<T>>(func: Func): Promise<T> => {
    let ret;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret;
};

// eslint-disable-next-line no-undef
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
            logger.error('failed to end session. possible resource leak', { error: endSessionErr });
        }
    }
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
                let: { templateId: `$${config.stepFields.templateId}` },
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

export const getProcessTemplatesByReviewerIdAggregation = async (
    query: FilterQuery<ProcessTemplateDocument>,
    reviewerId: string,
    limit: number,
    skip: number,
): Promise<IMongoProcessTemplatePopulated[]> => {
    const aggregationPipeline: FilterQuery<ProcessTemplateDocument>[] = [
        { $match: query },
        {
            $lookup: {
                from: config.mongo.stepInstancesCollectionName,
                let: { steps: '$steps' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ['$templateId', '$$steps'],
                            },
                        },
                    },
                ],
                as: 'stepInstances',
            },
        },
        {
            $lookup: {
                from: config.mongo.stepTemplatesCollectionName,
                let: { steps: '$steps' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: [{ $toString: '$_id' }, '$$steps'],
                            },
                        },
                    },
                ],
                as: 'steps',
            },
        },
        {
            $match: {
                $or: [
                    {
                        'steps.reviewers': reviewerId,
                    },
                    {
                        'stepInstances.reviewers': reviewerId,
                    },
                ],
            },
        },
        { $project: { stepInstances: 0 } },
    ];

    if (skip > 0) {
        aggregationPipeline.push({ $skip: skip + limit });
    }

    if (limit > 0) {
        aggregationPipeline.push({ $limit: limit });
    }

    return ProcessTemplateModel.aggregate(aggregationPipeline);
};

export const searchAllowedProcessInstanceForReviewerAggregation = (
    query: FilterQuery<ProcessInstanceDocument>,
    reviewerId: string,
    limit: number,
    skip: number,
) => {
    const aggregationPipeline: FilterQuery<ProcessInstanceDocument>[] = [
        { $match: query },
        {
            $lookup: {
                from: config.mongo.stepInstancesCollectionName,
                let: { steps: '$steps' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: [{ $toString: '$_id' }, '$$steps'],
                            },
                        },
                    },
                ],
                as: 'steps',
            },
        },
        {
            $lookup: {
                from: config.mongo.stepTemplatesCollectionName,
                let: { steps: '$steps' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: [{ $toString: '$_id' }, '$$steps.templateId'],
                            },
                        },
                    },
                ],
                as: 'stepTemplates',
            },
        },
        {
            $match: {
                $or: [
                    {
                        'steps.reviewers': reviewerId,
                    },
                    {
                        'stepTemplates.reviewers': reviewerId,
                    },
                ],
            },
        },
        { $project: { stepTemplates: 0 } },
    ];
    if (skip > 0) {
        aggregationPipeline.push({ $skip: skip + limit });
    }

    if (limit > 0) {
        aggregationPipeline.push({ $limit: limit });
    }
    aggregationPipeline.push({ $sort: { createdAt: -1 } });

    return ProcessInstanceModel.aggregate(aggregationPipeline);
};
