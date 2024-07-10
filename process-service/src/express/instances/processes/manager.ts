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
import { transaction, getTemplateAggregation, searchAllowedProcessInstanceForReviewerAggregation } from '../../../utils/mongoose';
import ProcessTemplateManager from '../../templates/processes/manager';
import config from '../../../config';
import { validateStepIds } from './validator.template';
import { IMongoProcessTemplate } from '../../templates/processes/interface';
import { IMongoStepInstance } from '../steps/interface';
import {
    createDocumentOnElastic,
    deleteDocumentOnElastic,
    processGlobalSearch,
    updateDocumentOnElastic,
} from '../../../utils/elastic/documentsOnElastic';
import StepInstanceManager from '../steps/manager';

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
        const [result] = await getTemplateAggregation(ProcessInstanceModel, config.mongo.processTemplatesCollectionName, id);
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

        const populatedProcess: IMongoProcessInstancePopulated = await this.getProcessById(processId);
        await createDocumentOnElastic(populatedProcess);

        return populatedProcess;
    }

    static async deleteProcess(id: string): Promise<IMongoProcessInstancePopulated> {
        const { steps: stepsIds } = await this.getProcessById(id, false);
        const { steps: processSteps } = await this.getProcessById(id);
        const deletedProcess: IMongoProcessInstance = await transaction(async (session) => {
            await StepInstanceManager.deleteStepsByIds(stepsIds, session);
            return ProcessInstanceModel.findByIdAndDelete(id, { session }).orFail(new NotFoundError('process', id)).lean();
        });
        await deleteDocumentOnElastic(deletedProcess._id);

        return { ...deletedProcess, steps: processSteps };
    }

    static async updateProcess(id: string, updatedData: UpdateProcessReqBody) {
        const currProcess = await this.getProcessById(id, false);
        if (currProcess.archived) throw new ServiceError(500, 'Can`t edit an archived process');

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

        const updatedProcess: IMongoProcessInstancePopulated = await transaction(async (session) => {
            await StepInstanceManager.updateStepsReviewers(stepsReviewers, session);

            const { steps, ...processData } = updatedData;
            return ProcessInstanceModel.findByIdAndUpdate(id, processData, {
                new: true,
                session,
            })
                .populate(config.processFields.steps)
                .orFail(new NotFoundError('process', id))
                .lean();
        });
        await updateDocumentOnElastic(updatedProcess);

        return updatedProcess;
    }

    static getProcessStatus(process: IMongoProcessInstancePopulated, updatedStep?: IMongoStepInstance) {
        const steps = updatedStep ? process.steps.map((step) => (String(step._id) === String(updatedStep!._id) ? updatedStep : step)) : process.steps;
        if (steps.some((step) => step.status === Status.Rejected)) return Status.Rejected;
        return steps.some((step) => step.status === Status.Pending) ? Status.Pending : Status.Approved;
    }

    static async archiveProcess(id: string, { archived }) {
        return ProcessInstanceModel.findByIdAndUpdate(id, { archived }, { new: true })
            .populate(config.processFields.steps)
            .orFail(new NotFoundError('process', id))
            .lean();
    }

    static async searchProcesses({
        searchText,
        reviewerId,
        ids,
        limit,
        skip,
        templateIds,
        startDate,
        endDate,
        status,
        archived,
        ...restOfQuery
    }: IProcessInstanceSearchProperties) {
        const query: FilterQuery<ProcessInstanceDocument> = { ...restOfQuery };
        let processes: IMongoProcessInstancePopulated[] = [];
        let processIds: string[] = [];
        if (archived !== undefined) query.archived = archived;
        if (templateIds) query.templateId = { $in: templateIds };
        if (startDate) query.startDate = { $gte: startDate };
        if (endDate) query.endDate = { $lte: endDate };
        if (ids) query._id = { $in: ids.map((id) => Types.ObjectId(id)) };
        if (status) query.status = { $in: status };
        if (reviewerId) {
            return searchAllowedProcessInstanceForReviewerAggregation(query, reviewerId, limit, skip);
        }

        if (searchText) {
            processIds = await processGlobalSearch(searchText);
            query._id = { $in: processIds.map((id) => Types.ObjectId(id)) };
        }

        processes = await ProcessInstanceModel.find(query, {}, processIds ? { limit, skip, sort: { createdAt: -1 } } : {})
            .populate(config.processFields.steps)
            .orFail(new ServiceError(500, 'No processes found'))
            .lean();

        if (processIds) processes.sort((a, b) => processIds.indexOf(a._id.toString()) - processIds.indexOf(b._id.toString()));

        return processes;
    }

    static async updateStatus(id: string, status: Status, session?: ClientSession) {
        const { status: currStatus } = await this.getProcessById(id);
        if (currStatus === status) throw new ServiceError(500, `status of process has not changed, get the same status: ${status}`);
        return ProcessInstanceModel.findByIdAndUpdate(id, { status, reviewedAt: new Date() }, { session });
    }
}

export default ProcessInstanceManager;
