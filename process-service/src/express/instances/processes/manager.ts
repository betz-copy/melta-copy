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
import { IMongoStepInstance } from '../steps/interface';
// import elasticClient from '../../../utils/elastic';

type ProcessInstanceType<T extends boolean> = T extends true ? IMongoProcessInstancePopulated & Document : IMongoProcessInstance & Document;
class ProcessInstanceManager {
    static async getProcessById<T extends boolean = true>(id: string, shouldPopulate: T = true as T): Promise<ProcessInstanceType<T>> {
        const query = ProcessInstanceModel.findById(id).orFail(new NotFoundError('process', id)).lean();
        return (shouldPopulate ? query.populate(config.processFields.steps) : query).exec() as Promise<ProcessInstanceType<T>>;
    }

    static async getAllProcesses(): Promise<ProcessInstanceDocument[]> {
        const query = ProcessInstanceModel.find({}); // .orFail(new ('')).lean();
        return query.populate(config.processFields.steps); // : query).exec() as Promise<ProcessInstanceType<T>>;
    }

    static async getProcessesByTemplateId(id: string) {
        return ProcessInstanceModel.find({ templateId: id }).orFail(new NotFoundError('process', id)).lean().exec();
    }

    static traverse(process) {
        let values = '';
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(process)) {
            if (key !== '_id' && key !== 'templateId' && key !== 'reviewers') {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    values += this.traverse(value);
                } else if (Array.isArray(value)) {
                    // eslint-disable-next-line no-loop-func
                    value.forEach((item) => {
                        values += this.traverse(item);
                    });
                } else {
                    values += `${value} `;
                }
            }
        }

        return values;
    }

    static async createDocumentOnElastic(process: IMongoProcessInstancePopulated) {
        const valuesString = this.traverse(process);
        console.log('hello ', valuesString.trim());
        // await elasticClient.index({
        //     index: 'processSearch',
        //     body: {
        //         id: process._id,
        //         searchValues: valuesString.trim(),
        //     },
        //     // id: process._id,
        //     // document: {
        //     //     searchValues: valuesString.trim(),
        //     // },
        // });
        // return POST processes/_doc/processId {searchString: valuesString.trim()}
    }

    // static async updateDocumentOnElastic(process) {
    //     // check if id already exist in elastic
    //     // es.exists(index = "processes", id = process.processId)
    //     // es.get((index = 'processes'), (id = process.processId));
    //     console.log('insideeee');

    //     const valuesString = this.traverse(process);
    //     const c = valuesString.trim();
    //     console.log({ valuesString }, { c });
    //     // return PUT processes/_doc/processId {searchString: valuesString.trim()}
    // }

    static deleteDocumentOnElastic(processId: string) {
        console.log({ processId });
        // return DELETE processes/_doc/processId
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

        const populatedProcess = await this.getProcessById(processId);
        console.log({ populatedProcess });
        await this.createDocumentOnElastic(populatedProcess);
        return populatedProcess;
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
        name,
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

        if (archived !== undefined) query.archived = archived;
        if (templateIds) query.templateId = { $in: templateIds };
        if (startDate) query.startDate = { $gte: startDate };
        if (endDate) query.endDate = { $lte: endDate };
        if (name) query.name = { $regex: escapeRegExp(name) };
        if (ids) query._id = { $in: ids.map((id) => Types.ObjectId(id)) };
        if (status) query.status = { $in: status };
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
