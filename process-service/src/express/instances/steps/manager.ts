/* eslint-disable class-methods-use-this */
import { ClientSession } from 'mongoose';
import config from '../../../config';
import { getTemplateAggregation, transaction } from '../../../utils/mongo';
import DefaultManagerMongo from '../../../utils/mongo/manager';
import { NotFoundError, ServiceError, StepNotPartOfProcessError, ValidationError } from '../../error';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import ProcessInstanceManager from '../processes/manager';
import { IMongoStepInstance, IStepInstance, StepInstanceDocument, UpdateStepReqBody } from './interface';
import StepInstanceModel from './model';

export default class StepInstanceManager extends DefaultManagerMongo<IStepInstance> {
    private processInstanceManager: ProcessInstanceManager;

    private stepInstanceManager: StepInstanceManager;

    constructor(dbName: string) {
        super(dbName, StepInstanceModel);
        this.processInstanceManager = new ProcessInstanceManager(dbName);
        this.stepInstanceManager = new StepInstanceManager(dbName);
    }

    validateStepIds(validStepIds: string[], stepIdsToCheck: string[]) {
        if (validStepIds.length !== stepIdsToCheck.length) throw new ValidationError('number of steps not matched the template');
        const unmatchedStepTemplateIds = stepIdsToCheck.filter((item) => !validStepIds.includes(item));
        if (unmatchedStepTemplateIds.length) throw new ValidationError('unmatched step ids');
    }

    async getStepById(id: string): Promise<IMongoStepInstance> {
        return this.model.findById(id).orFail(new NotFoundError('step', id)).lean();
    }

    async getSteps(ids: string[]): Promise<IMongoStepInstance[]> {
        return this.model
            .find({ _id: { $in: ids } })
            .orFail(new ServiceError(404, 'No matching step Templates found'))
            .lean();
    }

    async getStepTemplateByStepInstanceId(id: string): Promise<IMongoStepTemplate> {
        const [result] = await getTemplateAggregation(this.model, config.mongo.stepTemplatesCollectionName, id);
        if (!result) throw new NotFoundError('step', id);
        return result;
    }

    async createStepsInstances(steps: Pick<IStepInstance, 'reviewers' | 'templateId'>[], session?: ClientSession): Promise<StepInstanceDocument[]> {
        return this.model.insertMany(steps, { session });
    }

    async updateStepsReviewers(steps: Pick<IMongoStepInstance, 'reviewers' | '_id'>[], session?: ClientSession) {
        const bulkWriteOperations = steps.map((step) => ({
            updateOne: {
                filter: { _id: step._id },
                update: { $set: { reviewers: step.reviewers } },
            },
        }));
        await this.model.bulkWrite(bulkWriteOperations, { session });
    }

    async updateStep(id: string, { processId, properties, comments, statusReview }: UpdateStepReqBody) {
        const currProcess = await this.processInstanceManager.getProcessById(processId, true);

        if (!currProcess.steps.find((step) => String(step._id) === id)) throw new StepNotPartOfProcessError(id, processId);
        if (currProcess.archived) throw new ServiceError(500, "Can`t edit an archived process's step");

        if (!statusReview) {
            return this.model.findByIdAndUpdate(
                id,
                { properties, comments },
                {
                    new: true,
                },
            );
        }

        const currStep = await this.stepInstanceManager.getStepById(id);
        const updatedProcessStatus = this.processInstanceManager.getProcessStatus(currProcess, { ...currStep, status: statusReview.status });

        if (currProcess.status === updatedProcessStatus)
            return this.model
                .findByIdAndUpdate(id, { properties, comments, ...statusReview, reviewedAt: new Date() }, { new: true })
                .orFail(new NotFoundError('step', id))
                .lean();

        return transaction(async (session) => {
            await this.processInstanceManager.updateStatus(processId, updatedProcessStatus, session);
            return this.model
                .findByIdAndUpdate(id, { properties, comments, ...statusReview, reviewedAt: new Date() }, { new: true, session })
                .orFail(new NotFoundError('step', id))
                .lean();
        });
    }

    async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return this.model.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
