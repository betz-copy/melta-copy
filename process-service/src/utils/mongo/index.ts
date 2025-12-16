import {
    IMongoProcessTemplate,
    IMongoProcessTemplatePopulated,
    IProcessInstance,
    IProcessTemplate,
    IStepInstance,
    ProcessInstanceDocument,
    Status,
} from '@microservices/shared';
import { ClientSession, connection, FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import config from '../../config';

export const transaction = async <Func extends (session: ClientSession) => Promise<any>>(func: Func): Promise<Awaited<ReturnType<Func>>> => {
    // biome-ignore lint/suspicious/noImplicitAnyLet: to avoid build error
    let ret;

    await connection.transaction(async (session) => {
        ret = await func(session);
    });

    return ret;
};

export const getTemplateAggregation = async (model: Model<IProcessInstance> | Model<IStepInstance>, foreignCollectionName: string, id: string) => {
    return model.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(id),
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
    processTemplateModel: Model<IProcessTemplate>,
    query: FilterQuery<IMongoProcessTemplate>,
    reviewerId: string,
    limit: number,
    skip: number,
): Promise<IMongoProcessTemplatePopulated[]> => {
    const aggregationPipeline: PipelineStage[] = [
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

    return processTemplateModel.aggregate(aggregationPipeline);
};

export const searchAllowedProcessInstanceForReviewerAggregation = (
    processInstanceModel: Model<IProcessInstance>,
    query: FilterQuery<ProcessInstanceDocument>,
    reviewerId: string,
    limit: number,
    skip: number,
) => {
    const aggregationPipeline: PipelineStage[] = [
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

    return processInstanceModel.aggregate(aggregationPipeline);
};

export const searchAllowedProcessInstanceWaitForMe = (
    processInstanceModel: Model<IProcessInstance>,
    query: FilterQuery<ProcessInstanceDocument>,
    reviewerId: string,
) => {
    const aggregationPipeline: PipelineStage[] = [
        {
            $match: {
                ...query,
                status: Status.Pending,
            },
        },
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
            $unwind: {
                path: '$steps',
            },
        },
        {
            $match: {
                'steps.status': Status.Pending,
            },
        },
        {
            $set: {
                'steps.templateId': {
                    $toObjectId: '$steps.templateId',
                },
            },
        },
        {
            $lookup: {
                from: config.mongo.stepTemplatesCollectionName,
                localField: 'steps.templateId',
                foreignField: '_id',
                as: 'stepTemplates',
            },
        },
        {
            $unwind: {
                path: '$stepTemplates',
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
        {
            $group: {
                _id: '$_id',
                steps: {
                    $push: '$steps',
                },
                stepTemplates: {
                    $push: '$stepTemplates',
                },
                document: {
                    $first: '$$ROOT',
                },
            },
        },
        {
            $set: {
                'document.steps': '$steps',
                'document.stepTemplates': '$stepTemplates',
            },
        },
        {
            $replaceRoot: {
                newRoot: '$document',
            },
        },
    ];
    aggregationPipeline.push({ $sort: { createdAt: -1 } });

    return processInstanceModel.aggregate(aggregationPipeline);
};
