import { ClientSession } from 'mongoose';
import StepInstanceModel from './model';
import { IMongoStepInstance, IStepInstance, StepInstanceDocument } from './interface';
import { NotFoundError } from '../../error';
import config from '../../../config';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import { getTemplateAggregation } from '../../../utils/mongoose';

export default class StepInstanceManager {
    static async getStepById(id: string): Promise<IMongoStepInstance> {
        return StepInstanceModel.findById(id).orFail(new NotFoundError('step', id)).lean();
    }

    static async getStepTemplateByStepInstanceId(id: string): Promise<IMongoStepTemplate> {
        const [result] = await getTemplateAggregation(StepInstanceModel, config.mongo.stepTemplateCollectionName, id);
        if (!result) throw new NotFoundError('step', id);
        return result;
    }

    static async createStepsInstances(
        steps: Pick<IStepInstance, 'reviewers' | 'templateId'>[],
        session?: ClientSession,
    ): Promise<StepInstanceDocument[]> {
        return StepInstanceModel.insertMany(steps, { session });
    }

    static async updateStepsReviewers(steps: Pick<IMongoStepInstance, 'reviewers' | '_id'>[], session?: ClientSession) {
        const bulkWriteOperations = steps.map((step) => ({
            updateOne: {
                filter: { _id: step._id },
                update: { $set: { reviewers: step.reviewers } },
            },
        }));
        await StepInstanceModel.bulkWrite(bulkWriteOperations, { session });
    }

    static async updateStepProperties(id: string, properties: IStepInstance['properties']): Promise<IMongoStepInstance> {
        return StepInstanceModel.findByIdAndUpdate(id, { $set: properties }, { new: true }).orFail(new NotFoundError('step', id)).lean();
    }

    static async updateStepStatus(id: string, statusData: { status: IStepInstance['status']; reviewerId: string }): Promise<IMongoStepInstance> {
        return StepInstanceModel.findByIdAndUpdate(id, { ...statusData, reviewedAt: new Date() }, { new: true })
            .orFail(new NotFoundError('step', id))
            .lean();
    }

    static async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return StepInstanceModel.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
