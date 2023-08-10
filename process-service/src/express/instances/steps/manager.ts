import { ClientSession } from 'mongoose';
import StepInstanceModel from './model';
import { IMongoStepInstance, IStepInstance, StepInstanceDocument, UpdateStepReqBody } from './interface';
import { NotFoundError, ServiceError, StepNotPartOfProcessError } from '../../error';
import config from '../../../config';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import { getTemplateAggregation, transaction } from '../../../utils/mongoose';
import ProcessInstanceManager from '../processes/manager';
import { IMongoProcessInstancePopulated, Status } from '../processes/interface';

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
        const [result] = await getTemplateAggregation(StepInstanceModel, config.mongo.stepTemplateCollectionName, id);
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

    static getProcessStatus(stepWithNewStatus: IMongoStepInstance, process: IMongoProcessInstancePopulated) {
        const updatedSteps = process.steps.map((step) => (String(step._id) === String(stepWithNewStatus._id) ? stepWithNewStatus : step));

        if (updatedSteps.some((step) => step.status === Status.Rejected)) return Status.Rejected;
        return updatedSteps.some((step) => step.status === Status.Pending) ? Status.Pending : Status.Approved;
    }

    static async updateStep(id: string, data: UpdateStepReqBody) {
        const { statusReview, properties, comments } = data;
        if (!statusReview)
            return StepInstanceModel.findByIdAndUpdate(
                id,
                { properties, comments },
                {
                    new: true,
                },
            );
        const { processId, ...statusData } = statusReview;
        const currProcess = await ProcessInstanceManager.getProcessById(processId, true);
        if (!currProcess.steps.find((step) => String(step._id) === String(id))) throw new StepNotPartOfProcessError(id, processId);
        const currStep = await StepInstanceManager.getStepById(id);
        const updatedStatus = this.getProcessStatus({ ...currStep, status: statusData.status }, currProcess);
        if (currProcess.status === updatedStatus)
            return StepInstanceModel.findByIdAndUpdate(id, { properties, comments, ...statusData, reviewedAt: new Date() }, { new: true })
                .orFail(new NotFoundError('step', id))
                .lean();

        return transaction(async (session) => {
            await ProcessInstanceManager.updateStatus(processId, updatedStatus, session);
            return StepInstanceModel.findByIdAndUpdate(id, { properties, comments, ...statusData, reviewedAt: new Date() }, { new: true, session })
                .orFail(new NotFoundError('step', id))
                .lean();
        });
    }

    static async deleteStepsByIds(stepIds: string[], session?: ClientSession) {
        return StepInstanceModel.deleteMany({ _id: { $in: stepIds } }, { session });
    }
}
