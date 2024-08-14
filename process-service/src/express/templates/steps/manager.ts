import { ClientSession } from 'mongoose';
import StepTemplateModel from './model';
import { IMongoStepTemplate, IStepTemplate, StepTemplateDocument } from './interface';
import { NoMatchingStepsError, ServiceError, TemplateNotFoundError, ValidationError } from '../../error';

export default class StepTemplateManager {
    static async getStepTemplate(id: string): Promise<IMongoStepTemplate> {
        return StepTemplateModel.findById(id).orFail(new TemplateNotFoundError('step', id)).lean();
    }

    static async getStepTemplates(ids: string[]): Promise<IMongoStepTemplate[]> {
        return StepTemplateModel.find({ _id: { $in: ids } })
            .orFail(new NoMatchingStepsError())
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

        const stepsToUpdate = steps.filter((step) => step._id);
        const stepsToCreate = steps.filter((step) => !step._id);

        const bulkWriteOperations = stepsToUpdate.map((step) => ({
            updateOne: {
                filter: { _id: step._id },
                update: { $set: step },
            },
        }));

        const result = await StepTemplateModel.bulkWrite(bulkWriteOperations, { session });

        if ((result?.matchedCount ?? 0) < stepsToUpdate.length) {
            throw new ServiceError(404, `One or more of the steps to update doesn't exist`);
        }

        let newStepsIds: string[] = [];
        if (stepsToCreate.length) {
            const createdSteps = await this.createStepsTemplates(stepsToCreate, session);
            newStepsIds = createdSteps.map((step) => step._id!.toString());
        }
        const originalIds = stepsToUpdate.map((step) => step._id!.toString());
        return [...originalIds, ...newStepsIds];
    }

    static async deleteStepsByIds(ids: string[], session?: ClientSession) {
        return StepTemplateModel.deleteMany({ _id: { $in: ids } }, { session });
    }
}
