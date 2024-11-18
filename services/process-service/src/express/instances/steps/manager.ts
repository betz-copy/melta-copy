/* eslint-disable class-methods-use-this */
import { ClientSession } from 'mongoose';
import { IMongoStepTemplate, IMongoStepInstance, IStepInstance, UpdateStepReqBody } from '@microservices/shared';
import config from '../../../config';
import ElasticSearchManager from '../../../utils/elastic/documentsOnElastic';
import { getTemplateAggregation, transaction } from '../../../utils/mongo';
import { DefaultManagerMongo } from '../../../utils/mongo/manager';
import { InstanceNotFoundError, NotFoundError, ServiceError, StepNotPartOfProcessError, ValidationError } from '../../error';
import ProcessInstanceManager from '../processes/manager';
import { StepInstanceSchema } from './model';

export default class StepInstanceManager extends DefaultManagerMongo<IStepInstance> {
    private elasticSearchManager: ElasticSearchManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.stepInstancesCollectionName, StepInstanceSchema);
        this.elasticSearchManager = new ElasticSearchManager(workspaceId);
    }

    validateStepIds(validStepIds: string[], stepIdsToCheck: string[]) {
        if (validStepIds.length !== stepIdsToCheck.length) throw new ValidationError('number of steps not matched the template');
        const unmatchedStepTemplateIds = stepIdsToCheck.filter((item) => !validStepIds.includes(item));
        if (unmatchedStepTemplateIds.length) throw new ValidationError('unmatched step ids');
    }

    async getStepById(id: string): Promise<IMongoStepInstance> {
        return this.model.findById(id).orFail(new InstanceNotFoundError('step', id)).lean<IMongoStepInstance>();
    }

    async getSteps(ids: string[]): Promise<IMongoStepInstance[]> {
        return this.model
            .find({ _id: { $in: ids } })
            .orFail(new NotFoundError('No matching step Templates found'))
            .lean<IMongoStepInstance[]>();
    }

    async getStepTemplateByStepInstanceId(id: string): Promise<IMongoStepTemplate> {
        const [result] = await getTemplateAggregation(this.model, config.mongo.stepTemplatesCollectionName, id);
        if (!result) throw new InstanceNotFoundError('step', id);
        return result;
    }

    async createStepsInstances(steps: Pick<IStepInstance, 'reviewers' | 'templateId'>[], session?: ClientSession) {
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
        let updatedStep: IMongoStepInstance;
        const processInstanceManager = new ProcessInstanceManager(this.workspaceId);
        const currProcess = await processInstanceManager.getProcessById(processId, true);

        if (!currProcess.steps.find((step) => String(step._id) === id)) throw new StepNotPartOfProcessError(id, processId);
        if (currProcess.archived) throw new ServiceError(undefined, "Can`t edit an archived process's step");

        if (!statusReview) {
            updatedStep = await this.model
                .findByIdAndUpdate(
                    id,
                    { properties, comments },
                    {
                        new: true,
                    },
                )
                .orFail(new InstanceNotFoundError('step', id))
                .lean<IMongoStepInstance>();
        } else {
            const currStep = await this.getStepById(id);
            const updatedProcessStatus = processInstanceManager.getProcessStatus(currProcess, { ...currStep, status: statusReview.status });

            updatedStep = await transaction(async (session) => {
                if (currProcess.status !== updatedProcessStatus) await processInstanceManager.updateStatus(processId, updatedProcessStatus, session);

                return this.model
                    .findByIdAndUpdate(id, { properties, comments, ...statusReview, reviewedAt: new Date() }, { new: true, session })
                    .orFail(new InstanceNotFoundError('step', id))
                    .lean<IMongoStepInstance>();
            });
        }
        const updatedProcess = await processInstanceManager.getProcessById(processId, true);
        await this.elasticSearchManager.updateDocumentOnElastic(updatedProcess);

        return updatedStep;
    }

    async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return this.model.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
