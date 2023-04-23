import { FilterQuery, Document } from 'mongoose';
import ProcessInstanceModel from './model';
import { IProcessInstance, CreateAndUpdateProcessReqBody, IMongoProcessInstance, IMongoProcessInstancePopulated } from './interface';
import { NotFoundError } from '../../error';
import StepInstanceManager from '../steps/manager';
import { transaction, getTemplateAggregation } from '../../../utils/mongoose';
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

    static async createProcess(process: CreateAndUpdateProcessReqBody): Promise<IMongoProcessInstancePopulated> {
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

    static async updateProcess(id: string, updatedData: Partial<IProcessInstance & { steps: Record<string, string[]> }>) {
        const currProcess = await this.getProcessById(id, false);
        if (!updatedData.steps) {
            return ProcessInstanceModel.findByIdAndUpdate(id, updatedData, { new: true })
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
            return ProcessInstanceModel.findByIdAndUpdate(
                id,
                updatedProcess.status ? { ...updatedProcess, reviewedAt: new Date() } : updatedProcess,
                {
                    new: true,
                    session,
                },
            )
                .populate(config.processFields.steps)
                .orFail(new NotFoundError('process', id))
                .lean();
        });
    }

    static async searchProcesses({ name, ids, limit, skip }: { name?: string; ids?: string[]; limit: number; skip: number }) {
        const query: FilterQuery<IProcessInstance & Document> = {};
        if (name) query.name = { $regex: escapeRegExp(name) };
        if (ids) query._id = { $in: ids };

        return ProcessInstanceModel.find(query, {}, { limit, skip }).populate(config.processFields.steps).lean().exec();
    }
}

export default ProcessInstanceManager;
