/* eslint-disable class-methods-use-this */

import { ActionsLog, IUpdateProcessStepMetadata } from '@packages/activity-log';
import { IMongoStepInstance, IMongoStepTemplate, IStepInstance, UpdateStepReqBody } from '@packages/process';
import { DefaultManagerMongo, NotFoundError, ServiceError, ValidationError } from '@packages/utils';
import { ClientSession, Types, UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';
import config from '../../../config';
import { ActivityLogProducer } from '../../../externalServices/activityLog/producer';
import ElasticSearchManager from '../../../utils/elastic/documentsOnElastic';
import { getTemplateAggregation, transaction } from '../../../utils/mongo';
import { InstanceNotFoundError, StepNotPartOfProcessError } from '../../error';
import ProcessInstanceManager from '../processes/manager';
import { StepInstanceSchema } from './model';

export default class StepInstanceManager extends DefaultManagerMongo<IStepInstance> {
    private elasticSearchManager: ElasticSearchManager;

    private activityLogProducer: ActivityLogProducer;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.stepInstancesCollectionName, StepInstanceSchema);
        this.workspaceId = workspaceId;
        this.elasticSearchManager = new ElasticSearchManager(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
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
                filter: { _id: new Types.ObjectId(step._id) },
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
                .lean<IMongoStepInstance>();
        } else {
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

        const activityLogMetadata: IUpdateProcessStepMetadata['metadata'] = {};

        if (currStepTemplate.properties.properties) {
            const updatedFieldsActivityLog = Object.keys(currStepTemplate.properties.properties)
                .filter((key) => updatedStep.properties?.[key] !== currStep.properties?.[key]) // compare between newValue to oldValue
                .map((key) => ({
                    fieldName: key,
                    oldValue: currStep.properties?.[key] || '',
                    newValue: updatedStep.properties?.[key] || '',
                }));
            if (updatedFieldsActivityLog.length) activityLogMetadata.updatedFields = updatedFieldsActivityLog;
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

    async updateManySteps(
        query: Partial<IStepInstance>,
        stepData: UpdateQuery<IStepInstance> | UpdateWithAggregationPipeline,
        session?: ClientSession,
    ) {
        return this.model.updateMany(query, stepData, { session }).lean();
    }

    async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return this.model.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
