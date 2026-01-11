import { DefaultManagerMongo, IMongoStepTemplate, IStepTemplate, NotFoundError, ValidationError } from '@microservices/shared';
import { ClientSession, Types } from 'mongoose';
import config from '../../../config';
import { NoMatchingStepsError, TemplateNotFoundError } from '../../error';
import { StepTemplateSchema } from './model';

export default class StepTemplateManager extends DefaultManagerMongo<IStepTemplate> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.stepTemplatesCollectionName, StepTemplateSchema);
    }

    async getStepTemplate(id: string): Promise<IMongoStepTemplate> {
        return this.model.findById(id).orFail(new TemplateNotFoundError('step', id)).lean<IMongoStepTemplate>();
    }

    async getStepTemplates(ids: string[]): Promise<IMongoStepTemplate[]> {
        return this.model
            .find({ _id: { $in: ids } })
            .orFail(new NoMatchingStepsError())
            .lean<IMongoStepTemplate[]>();
    }

    private throwIfDuplicateStepName(steps: IStepTemplate[]) {
        const stepNames = steps.map(({ name }) => name);
        const stepUniqueNames = [...new Set(stepNames)];
        if (stepNames.length > stepUniqueNames.length) throw new ValidationError('process contains duplicate step name');

        const stepDisplayNames = steps.map(({ displayName }) => displayName);
        const stepUniqueDisplayNames = [...new Set(stepDisplayNames)];
        if (stepDisplayNames.length > stepUniqueDisplayNames.length) throw new ValidationError('process contains duplicate step display name');
    }

    async createStepsTemplates(steps: IStepTemplate[], session?: ClientSession) {
        this.throwIfDuplicateStepName(steps);
        return this.model.insertMany(steps, { session });
    }

    async updateStepsTemplates(steps: IMongoStepTemplate[], session?: ClientSession) {
        this.throwIfDuplicateStepName(steps);

        const stepsToUpdate = steps.filter((step) => step._id);
        const stepsToCreate = steps.filter((step) => !step._id);

        const bulkWriteOperations = stepsToUpdate.map((step) => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(step._id) },
                update: { $set: step },
            },
        }));

        const result = await this.model.bulkWrite(bulkWriteOperations, { session });

        if ((result?.matchedCount ?? 0) < stepsToUpdate.length) {
            throw new NotFoundError(`One or more of the steps to update doesn't exist`);
        }

        let newStepsIds: string[] = [];
        if (stepsToCreate.length) {
            const createdSteps = await this.createStepsTemplates(stepsToCreate, session);
            newStepsIds = createdSteps.map((step) => step._id!.toString());
        }
        const originalIds = stepsToUpdate.map((step) => step._id!.toString());
        return [...originalIds, ...newStepsIds];
    }

    async deleteStepsByIds(ids: string[], session?: ClientSession) {
        return this.model.deleteMany({ _id: { $in: ids } }, { session });
    }
}
