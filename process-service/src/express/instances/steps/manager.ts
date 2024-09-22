/* eslint-disable class-methods-use-this */
import { ClientSession } from 'mongoose';
import config from '../../../config';
import ElasticSearchManager from '../../../utils/elastic/documentsOnElastic';
import { getTemplateAggregation, transaction } from '../../../utils/mongo';
import { DefaultManagerMongo } from '../../../utils/mongo/manager';
import { NotFoundError, ServiceError, StepNotPartOfProcessError, ValidationError } from '../../error';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import ProcessInstanceManager from '../processes/manager';
import { IMongoStepInstance, IStepInstance, UpdateStepReqBody } from './interface';
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
        if (currProcess.archived) throw new ServiceError(500, "Can`t edit an archived process's step");

        if (!statusReview) {
            updatedStep = await this.model
                .findByIdAndUpdate(
                    id,
                    { properties, comments },
                    {
                        new: true,
                    },
                )
                .orFail(new NotFoundError('step', id))
                .lean();
        } else {
            const currStep = await this.getStepById(id);
            const updatedProcessStatus = processInstanceManager.getProcessStatus(currProcess, { ...currStep, status: statusReview.status });

            updatedStep = await transaction(async (session) => {
                if (currProcess.status !== updatedProcessStatus) await processInstanceManager.updateStatus(processId, updatedProcessStatus, session);

                return this.model
                    .findByIdAndUpdate(id, { properties, comments, ...statusReview, reviewedAt: new Date() }, { new: true, session })
                    .orFail(new NotFoundError('step', id))
                    .lean();
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
