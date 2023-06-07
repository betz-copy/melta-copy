import { ClientSession } from 'mongoose';
import StepTemplateModel from './model';
import { IMongoStepTemplate, IStepTemplate, StepTemplateDocument } from './interface';
import { ServiceError, TemplateNotFoundError, ValidationError } from '../../error';

export default class StepTemplateManager {
    static async getStepTemplate(id: string): Promise<IMongoStepTemplate> {
        return StepTemplateModel.findById(id).orFail(new TemplateNotFoundError('step', id)).lean();
    }

    static async getStepTemplates(ids: string[]): Promise<IMongoStepTemplate[]> {
        return StepTemplateModel.find({ _id: { $in: ids } })
            .orFail(new ServiceError(404, 'No matching step Templates found'))
            .lean();
    }

    private static throwIfDuplicateStepName(steps: IStepTemplate[]) {
        const stepNames = steps.map(({ name }) => name);
        const stepUniqueNames = [...new Set(stepNames)];
        if (stepNames.length > stepUniqueNames.length) throw new ValidationError('process contains duplicate step name');

        const stepDisplayNames = steps.map(({ displayName }) => displayName);
        const stepUniqueDisplayNames = [...new Set(stepDisplayNames)];
        if (stepDisplayNames.length > stepUniqueDisplayNames.length) throw new ValidationError('process contains duplicate step display name');
    }

    static async createStepsTemplates(steps: IStepTemplate[], session?: ClientSession): Promise<StepTemplateDocument[]> {
        this.throwIfDuplicateStepName(steps);
        return StepTemplateModel.insertMany(steps, { session });
    }

    static async updateStepsTemplates(steps: IMongoStepTemplate[], session?: ClientSession) {
        this.throwIfDuplicateStepName(steps);
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
