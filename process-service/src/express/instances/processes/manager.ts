/* eslint-disable class-methods-use-this */
import { Request } from 'express';
import { ClientSession, Document, FilterQuery, Types } from 'mongoose';
import config from '../../../config';
import { escapeRegExp } from '../../../utils';
import ajv from '../../../utils/ajv';
import DefaultManager from '../../../utils/express/manager';
import { getTemplateAggregation, searchAllowedProcessInstanceForReviewerAggregation, transaction } from '../../../utils/mongoose';
import { InstancePropertiesValidationError, NotFoundError, ServiceError, ValidationError } from '../../error';
import { IMongoProcessTemplate, IProcessDetails } from '../../templates/processes/interface';
import ProcessTemplateManager from '../../templates/processes/manager';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import StepTemplateManager from '../../templates/steps/manager';
import { IMongoStepInstance } from '../steps/interface';
import StepInstanceManager from '../steps/manager';
import {
    CreateProcessReqBody,
    IMongoProcessInstance,
    IMongoProcessInstancePopulated,
    IProcessInstance,
    IProcessInstanceSearchProperties,
    InstanceProperties,
    ProcessInstanceDocument,
    Status,
    UpdateProcessReqBody,
} from './interface';
import ProcessInstanceModel from './model';

type ProcessInstanceType<T extends boolean> = T extends true ? IMongoProcessInstancePopulated & Document : IMongoProcessInstance & Document;
class ProcessInstanceManager extends DefaultManager<IProcessInstance> {
    private stepInstanceManager: StepInstanceManager;

    private processTemplateManager: ProcessTemplateManager;

    private stepTemplateManager: StepTemplateManager;

    constructor(dbName: string) {
        super(dbName, ProcessInstanceModel);
        this.stepInstanceManager = new StepInstanceManager(dbName);
        this.processTemplateManager = new ProcessTemplateManager(dbName);
        this.stepTemplateManager = new StepTemplateManager(dbName);
    }

    private static validateInstanceProperties(instanceProperties: InstanceProperties, templateProperties: IProcessDetails['properties']) {
        const validate = ajv.compile(templateProperties);
        const isValid = validate(instanceProperties);

        if (!isValid) {
            throw new InstancePropertiesValidationError(JSON.stringify(validate.errors));
        }
    }

    private static validateReviewersNotInTemplate(
        instanceStepReviewersByTemplateStepIds: Record<string, string[]>,
        stepTemplates: IMongoStepTemplate[],
    ) {
        Object.entries(instanceStepReviewersByTemplateStepIds).forEach(([templateStepId, reviewers]) => {
            const stepTemplate = stepTemplates.find((currStepTemplate) => String(currStepTemplate._id) === templateStepId);

            if (!stepTemplate) throw new ValidationError('step not found in template');

            if (stepTemplate.reviewers.some((templateReviewer) => reviewers.includes(templateReviewer))) {
                throw new ValidationError('reviewer already in template');
            }
        });
    }

    async validateCreateProcessInstance(req: Request) {
        const { templateId, details, steps }: CreateProcessReqBody = req.body;

        const template = await this.processTemplateManager.getProcessTemplateById(templateId, false);
        const stepTemplates = await this.stepTemplateManager.getStepTemplates(template.steps);

        ProcessInstanceManager.validateReviewersNotInTemplate(steps, stepTemplates);
        ProcessInstanceManager.validateInstanceProperties(details, template.details.properties);
    }

    async validateUpdateProcessInstance(req: Request) {
        const { steps, details }: UpdateProcessReqBody = req.body;

        const template = await this.getProcessTemplateByProcessId(req.params.id);

        if (steps) {
            const [stepTemplates, stepInstances] = await Promise.all([
                this.stepTemplateManager.getStepTemplates(template.steps),
                this.stepInstanceManager.getSteps(Object.keys(steps)),
            ]);

            const instanceStepsWithTemplateStepIds: Record<string, string[]> = {};

            stepInstances.forEach((step) => {
                instanceStepsWithTemplateStepIds[step.templateId] = steps[step._id];
            });

            ProcessInstanceManager.validateReviewersNotInTemplate(instanceStepsWithTemplateStepIds, stepTemplates);
        }

        if (details) {
            ProcessInstanceManager.validateInstanceProperties(details, template.details.properties);
        }
    }

    async getProcessById<T extends boolean = true>(id: string, shouldPopulate: T = true as T): Promise<ProcessInstanceType<T>> {
        const query = this.model.findById(id).orFail(new NotFoundError('process', id)).lean();
        return (shouldPopulate ? query.populate(config.processFields.steps) : query).exec() as Promise<ProcessInstanceType<T>>;
    }

    async getProcessesByTemplateId(id: string) {
        return this.model.find({ templateId: id }).orFail(new NotFoundError('process', id)).lean().exec();
    }

    async getProcessTemplateByProcessId(id: string): Promise<IMongoProcessTemplate> {
        const [result] = await getTemplateAggregation(this.model, config.mongo.processTemplatesCollectionName, id);
        if (!result) throw new NotFoundError('process', id);
        return result;
    }

    async createProcess(process: CreateProcessReqBody): Promise<IMongoProcessInstancePopulated> {
        const initialSteps = Object.entries(process.steps).map(([templateId, reviewers]) => ({
            templateId,
            reviewers,
        }));
        const processId: string = await transaction(async (session) => {
            const steps = await this.stepInstanceManager.createStepsInstances(initialSteps, session);
            const processTemplate = await this.processTemplateManager.getProcessTemplateById(process.templateId!, false);

            const stepIds = steps
                .sort((a, b) => processTemplate.steps.indexOf(a.templateId) - processTemplate.steps.indexOf(b.templateId))
                .map((step) => step._id);

            // mongoose create doesn't work well with sessions,the first argument must be an array
            // so use insertMany instead and pass array of one process.
            const [{ _id }] = await this.model.insertMany([{ ...process, steps: stepIds }], { session });
            return _id;
        });
        return this.getProcessById(processId);
    }

    async deleteProcess(id: string): Promise<IMongoProcessInstancePopulated> {
        const { steps: stepsIds } = await this.getProcessById(id, false);
        const { steps: processSteps } = await this.getProcessById(id);
        const deletedProcess: IMongoProcessInstance = await transaction(async (session) => {
            await this.stepInstanceManager.deleteStepsByIds(stepsIds, session);
            return this.model.findByIdAndDelete(id, { session }).orFail(new NotFoundError('process', id)).lean();
        });
        return { ...deletedProcess, steps: processSteps };
    }

    async updateProcess(id: string, updatedData: UpdateProcessReqBody) {
        const currProcess = await this.getProcessById(id, false);
        if (currProcess.archived) throw new ServiceError(500, 'Can`t edit an archived process');

        if (!updatedData.steps) {
            return this.model
                .findByIdAndUpdate(id, updatedData as Omit<UpdateProcessReqBody, 'steps'>, {
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

        this.stepInstanceManager.validateStepIds(currProcess.steps, Object.keys(updatedData.steps));

        return transaction(async (session) => {
            await this.stepInstanceManager.updateStepsReviewers(stepsReviewers, session);

            const { steps, ...updatedProcess } = updatedData;
            return this.model
                .findByIdAndUpdate(id, updatedProcess, {
                    new: true,
                    session,
                })
                .populate(config.processFields.steps)
                .orFail(new NotFoundError('process', id))
                .lean();
        });
    }

    getProcessStatus(process: IMongoProcessInstancePopulated, updatedStep?: IMongoStepInstance) {
        const steps = updatedStep ? process.steps.map((step) => (String(step._id) === String(updatedStep!._id) ? updatedStep : step)) : process.steps;
        if (steps.some((step) => step.status === Status.Rejected)) return Status.Rejected;
        return steps.some((step) => step.status === Status.Pending) ? Status.Pending : Status.Approved;
    }

    async archiveProcess(id: string, { archived }) {
        return this.model
            .findByIdAndUpdate(id, { archived }, { new: true })
            .populate(config.processFields.steps)
            .orFail(new NotFoundError('process', id))
            .lean();
    }

    async searchProcesses({
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

        return this.model
            .find(query, {}, { limit, skip, sort: { createdAt: -1 } })
            .populate(config.processFields.steps)
            .lean()
            .exec();
    }

    async updateStatus(id: string, status: Status, session?: ClientSession) {
        const { status: currStatus } = await this.getProcessById(id);
        if (currStatus === status) throw new ServiceError(500, `status of process has not changed, get the same status: ${status}`);
        return this.model.findByIdAndUpdate(id, { status, reviewedAt: new Date() }, { session });
    }
}

export default ProcessInstanceManager;
