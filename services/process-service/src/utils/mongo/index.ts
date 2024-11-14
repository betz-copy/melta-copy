import { ClientSession, connection, FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import {
    IMongoProcessTemplate,
    IMongoProcessTemplatePopulated,
    IProcessTemplate,
} from '@microservices/shared/src/interfaces/process/templates/process';
import { IStepInstance } from '@microservices/shared/src/interfaces/process/instances/step';
import { IProcessInstance, ProcessInstanceDocument } from '@microservices/shared/src/interfaces/process/instances/process';
import config from '../../config';

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
