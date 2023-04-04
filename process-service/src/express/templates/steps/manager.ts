import { ClientSession } from 'mongoose';
import StepTemplateModel from './model';
import { IMongoStepTemplate, IStepTemplate, StepTemplateDocument } from './interface';
import { ServiceError, TemplateNotFoundError } from '../../error';

export default class StepTemplateManager {
    static async getStepTemplate(id: string): Promise<IStepTemplate> {
        return StepTemplateModel.findById(id).orFail(new TemplateNotFoundError('step', id)).lean().exec();
    }

    static async getStepTemplates(ids: string[]): Promise<IStepTemplate[]> {
        return StepTemplateModel.find({ _id: { $in: ids } })
            .orFail(new ServiceError(404, 'No matching step Templates found'))
            .lean()
            .exec();
    }

    static async createStepsTemplates(steps: IStepTemplate[], session?: ClientSession): Promise<StepTemplateDocument[]> {
        return StepTemplateModel.insertMany(steps, { session });
    }

    static async updateStepsTemplates(steps: IMongoStepTemplate[], session?: ClientSession) {
        const bulkWriteOperations = steps.map((step) => ({
            updateOne: {
                filter: { _id: step._id },
                update: { $set: step },
            },
        }));
        await StepTemplateModel.bulkWrite(bulkWriteOperations, { session });
    }

    static async deleteStepsByIds(ids: string[], session?: ClientSession) {
        return StepTemplateModel.deleteMany({ _id: { $in: ids } }, { session });
    }
}
