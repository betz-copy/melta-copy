import { FilterQuery, Document, Types, ClientSession } from 'mongoose';
import ProcessInstanceModel from './model';
import {
    CreateProcessReqBody,
    IMongoProcessInstance,
    IMongoProcessInstancePopulated,
    IProcessInstanceSearchProperties,
    UpdateProcessReqBody,
    ProcessInstanceDocument,
    Status,
} from './interface';
import { NotFoundError, ServiceError } from '../../error';
import StepInstanceManager from '../steps/manager';
import { transaction, getTemplateAggregation, searchAllowedProcessInstanceForReviewerAggregation } from '../../../utils/mongoose';
import ProcessTemplateManager from '../../templates/processes/manager';
import config from '../../../config';
import { validateStepIds } from './validator.template';
import { escapeRegExp } from '../../../utils';
import { IMongoProcessTemplate } from '../../templates/processes/interface';

type ProcessInstanceType<T extends boolean> = T extends true ? IMongoProcessInstancePopulated & Document : IMongoProcessInstance & Document;
class ProcessInstanceManager {
    static async getProcessById<T extends boolean = true>(id: string, shouldPopulate: T = true as T): Promise<ProcessInstanceType<T>> {
        const query = ProcessInstanceModel.findById(id).orFail(new NotFoundError('process', id)).lean();
        return (shouldPopulate ? query.populate(config.processFields.steps) : query).exec() as Promise<ProcessInstanceType<T>>;
    }

    static async getProcessesByTemplateId(id: string) {
        return ProcessInstanceModel.find({ templateId: id }).orFail(new NotFoundError('process', id)).lean().exec();
    }

    static async getProcessTemplateByProcessId(id: string): Promise<IMongoProcessTemplate> {
        const [result] = await getTemplateAggregation(ProcessInstanceModel, config.mongo.processTemplateCollectionName, id);
        if (!result) throw new NotFoundError('process', id);
        return result;
    }

    static async createProcess(process: CreateProcessReqBody): Promise<IMongoProcessInstancePopulated> {
        const initialSteps = Object.entries(process.steps).map(([templateId, reviewers]) => ({
            templateId,
            reviewers,
        }));
        const processId: string = await transaction(async (session) => {
            const steps = await StepInstanceManager.createStepsInstances(initialSteps, session);
            const processTemplate = await ProcessTemplateManager.getProcessTemplateById(process.templateId!, false);

            const stepIds = steps
                .sort((a, b) => processTemplate.steps.indexOf(a.templateId) - processTemplate.steps.indexOf(b.templateId))
                .map((step) => step._id);

            // mongoose create doesn't work well with sessions,the first argument must be an array
            // so use insertMany instead and pass array of one process.
            const [{ _id }] = await ProcessInstanceModel.insertMany([{ ...process, steps: stepIds }], { session });
            return _id;
        });
        return this.getProcessById(processId);
    }

    static async deleteProcess(id: string): Promise<IMongoProcessInstancePopulated> {
        const { steps: stepsIds } = await this.getProcessById(id, false);
        const { steps: processSteps } = await this.getProcessById(id);
        const deletedProcess: IMongoProcessInstance = await transaction(async (session) => {
            await StepInstanceManager.deleteStepsByIds(stepsIds, session);
            return ProcessInstanceModel.findByIdAndDelete(id, { session }).orFail(new NotFoundError('process', id)).lean();
        });
        return { ...deletedProcess, steps: processSteps };
    }

    static async updateProcess(id: string, updatedData: UpdateProcessReqBody) {
        const currProcess = await this.getProcessById(id, false);
        if (!updatedData.steps) {
            return ProcessInstanceModel.findByIdAndUpdate(id, updatedData as Omit<UpdateProcessReqBody, 'steps'>, {
                new: true,
            })
                .populate(config.processFields.steps)
                .orFail(new NotFoundError('process', id))
                .lean();
        }

        const stepsReviewers = Object.entries(updatedData.steps).map(([_id, reviewers]) => ({
            _id,
            reviewers,
        }));

        validateStepIds(currProcess.steps, Object.keys(updatedData.steps));

        return transaction(async (session) => {
            await StepInstanceManager.updateStepsReviewers(stepsReviewers, session);

            const { steps, ...updatedProcess } = updatedData;
            return ProcessInstanceModel.findByIdAndUpdate(id, updatedProcess, {
                new: true,
                session,
            })
                .populate(config.processFields.steps)
                .orFail(new NotFoundError('process', id))
                .lean();
        });
    }

    static async searchProcesses({
        name,
        reviewerId,
        ids,
        limit,
        skip,
        templateIds,
        startDate,
        endDate,
        ...restOfQuery
    }: IProcessInstanceSearchProperties) {
        const query: FilterQuery<ProcessInstanceDocument> = { ...restOfQuery };

        if (templateIds) query.templateId = { $in: templateIds };
        if (startDate) query.startDate = { $gte: startDate };
        if (endDate) query.endDate = { $lte: endDate };
        if (name) query.name = { $regex: escapeRegExp(name) };
        if (ids) query._id = { $in: ids.map((id) => Types.ObjectId(id)) };

        if (reviewerId) {
            return searchAllowedProcessInstanceForReviewerAggregation(query, reviewerId, limit, skip);
        }
        return ProcessInstanceModel.find(query, {}, { limit, skip, sort: { createdAt: -1 } })
            .populate(config.processFields.steps)
            .lean()
            .exec();
    }

    static async updateStatus(id: string, status: Status, session?: ClientSession) {
        const { status: currStatus } = await this.getProcessById(id);
        if (currStatus === status) throw new ServiceError(500, `status of process has not changed, get the same status: ${status}`);
        return ProcessInstanceModel.findByIdAndUpdate(id, { status, reviewedAt: new Date() }, { session });
    }
}

export default ProcessInstanceManager;
