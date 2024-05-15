import { ClientSession } from 'mongoose';
import StepInstanceModel from './model';
import { IMongoStepInstance, IStepInstance, StepInstanceDocument, UpdateStepReqBody } from './interface';
import { NotFoundError, ServiceError, StepNotPartOfProcessError } from '../../error';
import config from '../../../config';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import { getTemplateAggregation, transaction } from '../../../utils/mongoose';
import ProcessInstanceManager from '../processes/manager';
import { updateDocumentOnElastic } from '../../../utils/elastic/documentsOnElastic';

export default class StepInstanceManager {
    static async getStepById(id: string): Promise<IMongoStepInstance> {
        return StepInstanceModel.findById(id).orFail(new NotFoundError('step', id)).lean();
    }

    static async getSteps(ids: string[]): Promise<IMongoStepInstance[]> {
        return StepInstanceModel.find({ _id: { $in: ids } })
            .orFail(new ServiceError(404, 'No matching step Templates found'))
            .lean();
    }

    static async getStepTemplateByStepInstanceId(id: string): Promise<IMongoStepTemplate> {
        const [result] = await getTemplateAggregation(StepInstanceModel, config.mongo.stepTemplatesCollectionName, id);
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

    static async updateStep(id: string, { processId, properties, comments, statusReview }: UpdateStepReqBody) {
        const currProcess = await ProcessInstanceManager.getProcessById(processId, true);

        if (!currProcess.steps.find((step) => String(step._id) === id)) throw new StepNotPartOfProcessError(id, processId);
        if (currProcess.archived) throw new ServiceError(500, "Can`t edit an archived process's step");

        if (!statusReview) {
            const updatedStep = await StepInstanceModel.findByIdAndUpdate(
                id,
                { properties, comments },
                {
                    new: true,
                },
            );

            const updatedProcess = await ProcessInstanceManager.getProcessById(processId, true);
            await updateDocumentOnElastic(updatedProcess);

            return updatedStep;
        }

        const currStep = await StepInstanceManager.getStepById(id);
        const updatedProcessStatus = ProcessInstanceManager.getProcessStatus(currProcess, { ...currStep, status: statusReview.status });

        if (currProcess.status === updatedProcessStatus) {
            const updatedStep = await StepInstanceModel.findByIdAndUpdate(
                id,
                { properties, comments, ...statusReview, reviewedAt: new Date() },
                { new: true },
            )
                .orFail(new NotFoundError('step', id))
                .lean();
            const updatedProcess = await ProcessInstanceManager.getProcessById(processId, true);
            await updateDocumentOnElastic(updatedProcess);
            return updatedStep;
        }

        return transaction(async (session) => {
            await ProcessInstanceManager.updateStatus(processId, updatedProcessStatus, session);
            const updatedStep = await StepInstanceModel.findByIdAndUpdate(
                id,
                { properties, comments, ...statusReview, reviewedAt: new Date() },
                { new: true, session },
            )
                .orFail(new NotFoundError('step', id))
                .lean();
            const updatedProcess = await ProcessInstanceManager.getProcessById(processId, true);
            await updateDocumentOnElastic(updatedProcess);
            return updatedStep;
        });
    }

    static async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return StepInstanceModel.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
