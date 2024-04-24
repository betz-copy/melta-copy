import { ClientSession, FilterQuery, Model, Types, connection } from 'mongoose';
import config from '../../config';
import { IProcessInstance, ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ProcessInstanceModel from '../../express/instances/processes/model';
import { IStepInstance } from '../../express/instances/steps/interface';
import { IMongoProcessTemplatePopulated, ProcessTemplateDocument } from '../../express/templates/processes/interface';
import ProcessTemplateModel from '../../express/templates/processes/model';

export const transaction = async <T, Func extends (session: ClientSession) => Promise<T>>(func: Func): Promise<T> => {
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
