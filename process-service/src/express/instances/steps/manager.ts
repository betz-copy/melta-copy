/* eslint-disable class-methods-use-this */
import { ClientSession } from 'mongoose';
import config from '../../../config';
import ElasticSearchManager from '../../../utils/elastic/documentsOnElastic';
import { getTemplateAggregation, transaction } from '../../../utils/mongo';
import { DefaultManagerMongo } from '../../../utils/mongo/manager';
import { InstanceNotFoundError, NotFoundError, ServiceError, StepNotPartOfProcessError, ValidationError } from '../../error';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import ProcessInstanceManager from '../processes/manager';
import { IMongoStepInstance, IStepInstance, UpdateStepReqBody } from './interface';
import { StepInstanceSchema } from './model';
import { ActivityLogProducer } from '../../../externalServices/activityLog/producer';
import { ActionsLog, IUpdateProcessStepMetadata } from '../../../externalServices/activityLog/interface';

export default class StepInstanceManager extends DefaultManagerMongo<IStepInstance> {
    private elasticSearchManager: ElasticSearchManager;

    private activityLogProducer: ActivityLogProducer;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.stepInstancesCollectionName, StepInstanceSchema);
        this.elasticSearchManager = new ElasticSearchManager(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
    }

    validateStepIds(validStepIds: string[], stepIdsToCheck: string[]) {
        if (validStepIds.length !== stepIdsToCheck.length) throw new ValidationError('number of steps not matched the template');
        const unmatchedStepTemplateIds = stepIdsToCheck.filter((item) => !validStepIds.includes(item));
        if (unmatchedStepTemplateIds.length) throw new ValidationError('unmatched step ids');
    }

    async getStepById(id: string): Promise<IMongoStepInstance> {
        return this.model.findById(id).orFail(new InstanceNotFoundError('step', id)).lean();
    }

    async getSteps(ids: string[]): Promise<IMongoStepInstance[]> {
        return this.model
            .find({ _id: { $in: ids } })
            .orFail(new NotFoundError('No matching step Templates found'))
            .lean();
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

    async updateStep(id: string, { processId, properties, comments, statusReview }: UpdateStepReqBody, userId: string) {
        let updatedStep: IMongoStepInstance;
        const processInstanceManager = new ProcessInstanceManager(this.workspaceId);
        const currProcess = await processInstanceManager.getProcessById(processId, true);

        if (!currProcess.steps.find((step) => String(step._id) === id)) throw new StepNotPartOfProcessError(id, processId);
        if (currProcess.archived) throw new ServiceError(undefined, "Can`t edit an archived process's step");

        const currStep = await this.getStepById(id);
        const currStepTemplate = await this.getStepTemplateByStepInstanceId(id);

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
                .lean();
        } else {
            const updatedProcessStatus = processInstanceManager.getProcessStatus(currProcess, { ...currStep, status: statusReview.status });

            updatedStep = await transaction(async (session) => {
                if (currProcess.status !== updatedProcessStatus) await processInstanceManager.updateStatus(processId, updatedProcessStatus, session);

                return this.model
                    .findByIdAndUpdate(id, { properties, comments, ...statusReview, reviewedAt: new Date() }, { new: true, session })
                    .orFail(new InstanceNotFoundError('step', id))
                    .lean();
            });
        }
        const updatedProcess = await processInstanceManager.getProcessById(processId, true);
        await this.elasticSearchManager.updateDocumentOnElastic(updatedProcess);

        const activityLogMetadata: IUpdateProcessStepMetadata['metadata'] = {};

        if (currStepTemplate.properties.properties) {
            const updatedFieldsActivityLog = Object.keys(currStepTemplate.properties.properties)
                .filter((key) => {
                    return updatedStep.properties?.[key] !== currStep.properties?.[key]; // compare between newValue to oldValue
                })
                .map((key) => {
                    return {
                        fieldName: key,
                        oldValue: currStep.properties?.[key] || '',
                        newValue: updatedStep.properties?.[key] || '',
                    };
                });
            if (updatedFieldsActivityLog.length > 0) activityLogMetadata.updatedFields = updatedFieldsActivityLog;
        }

        if (statusReview?.status && statusReview?.status !== currStep.status) activityLogMetadata.status = statusReview?.status;
        if (comments !== currStep.comments) activityLogMetadata.comments = comments;

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.UPDATE_PROCESS_STEP,
            entityId: id,
            timestamp: new Date(),
            metadata: activityLogMetadata,
            userId,
        });

        return updatedStep;
    }

    async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return this.model.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
