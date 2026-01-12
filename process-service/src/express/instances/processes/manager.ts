import { ActionsLog } from '@packages/activity-log';
import {
    CreateProcessReqBody,
    IMongoProcessInstance,
    IMongoProcessInstancePopulated,
    IMongoProcessTemplate,
    IMongoProcessTemplatePopulated,
    IMongoStepInstance,
    IMongoStepTemplate,
    InstanceProperties,
    IProcessDetails,
    IProcessInstance,
    IProcessInstanceSearchProperties,
    ProcessInstanceDocument,
    Status,
    UpdateProcessReqBody,
} from '@packages/process';
import { DefaultManagerMongo, ServiceError, ValidationError } from '@packages/utils';
import { Request } from 'express';
import { ClientSession, FilterQuery, Types, UpdateWriteOpResult } from 'mongoose';
import config from '../../../config';
import { ActivityLogProducer } from '../../../externalServices/activityLog/producer';
import ajv from '../../../utils/ajv';
import ElasticSearchManager from '../../../utils/elastic/documentsOnElastic';
import {
    getTemplateAggregation,
    searchAllowedProcessInstanceForReviewerAggregation,
    searchAllowedProcessInstanceWaitForMe,
    transaction,
} from '../../../utils/mongo';
import { InstanceNotFoundError, InstancePropertiesValidationError } from '../../error';
import ProcessTemplateManager from '../../templates/processes/manager';
import StepInstanceManager from '../steps/manager';
import { ProcessInstanceSchema } from './model';

type ProcessInstanceType<T extends boolean> = T extends true ? IMongoProcessInstancePopulated : IMongoProcessInstance;

class ProcessInstanceManager extends DefaultManagerMongo<IProcessInstance> {
    private processTemplateManager: ProcessTemplateManager;

    private stepInstanceManager: StepInstanceManager;

    private elasticSearchManager: ElasticSearchManager;

    private activityLogProducer: ActivityLogProducer;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.processInstancesCollectionName, ProcessInstanceSchema);
        this.processTemplateManager = new ProcessTemplateManager(workspaceId);
        this.stepInstanceManager = new StepInstanceManager(workspaceId);
        this.elasticSearchManager = new ElasticSearchManager(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
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
        const stepTemplates = await this.processTemplateManager.stepTemplateManager.getStepTemplates(template.steps);

        ProcessInstanceManager.validateReviewersNotInTemplate(steps, stepTemplates);
        ProcessInstanceManager.validateInstanceProperties(details, template.details.properties);
    }

    async validateUpdateProcessInstance(req: Request) {
        const { steps, details }: UpdateProcessReqBody = req.body;

        const template = await this.getProcessTemplateByProcessId(req.params.id);

        if (steps) {
            const [stepTemplates, stepInstances] = await Promise.all([
                this.processTemplateManager.stepTemplateManager.getStepTemplates(template.steps),
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
        const query = this.model.findById(id).orFail(new InstanceNotFoundError('process', id)).lean();
        return (shouldPopulate ? query.populate(config.processFields.steps) : query).exec() as unknown as Promise<ProcessInstanceType<T>>;
    }

    async getProcessesByTemplateId(id: string) {
        return this.model.find({ templateId: id }).orFail(new InstanceNotFoundError('process', id)).lean().exec();
    }

    async getProcessTemplateByProcessId(id: string): Promise<IMongoProcessTemplate> {
        const [result] = await getTemplateAggregation(this.model, config.mongo.processTemplatesCollectionName, id);
        if (!result) throw new InstanceNotFoundError('process', id);
        return result;
    }

    async createProcess(process: CreateProcessReqBody, userId: string): Promise<IMongoProcessInstancePopulated> {
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
            return _id.toString();
        });

        const populatedProcess: IMongoProcessInstancePopulated = await this.getProcessById(processId);
        await this.elasticSearchManager.createDocumentOnElastic(populatedProcess);

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.CREATE_PROCESS,
            entityId: populatedProcess._id,
            timestamp: new Date(),
            metadata: {},
            userId,
        });

        return populatedProcess;
    }

    async deleteProcess(id: string): Promise<IMongoProcessInstancePopulated> {
        const { steps: stepsIds } = await this.getProcessById(id, false);
        const { steps: processSteps } = await this.getProcessById(id);
        const deletedProcess: IMongoProcessInstance = await transaction(async (session) => {
            await this.stepInstanceManager.deleteStepsByIds(stepsIds, session);
            return this.model.findByIdAndDelete(id, { session }).orFail(new InstanceNotFoundError('process', id)).lean<IMongoProcessInstance>();
        });
        await this.elasticSearchManager.deleteDocumentOnElastic(deletedProcess._id);

        return { ...deletedProcess, steps: processSteps };
    }

    async updateProcess(id: string, updatedData: UpdateProcessReqBody, userId: string) {
        const currProcess = await this.getProcessById(id, false);
        const currProcessTemplate = await this.processTemplateManager.getProcessTemplateById(currProcess.templateId);

        if (currProcess.archived) throw new ServiceError(undefined, 'Can`t edit an archived process');

        if (!updatedData.steps) {
            return this.model
                .findByIdAndUpdate(id, updatedData as Omit<UpdateProcessReqBody, 'steps'>, {
                    new: true,
                })
                .populate(config.processFields.steps)
                .orFail(new InstanceNotFoundError('process', id))
                .lean();
        }

        const stepsReviewers = Object.entries(updatedData.steps).map(([_id, reviewers]) => ({
            _id,
            reviewers,
        }));

        this.stepInstanceManager.validateStepIds(currProcess.steps, Object.keys(updatedData.steps));

        const updatedProcess: IMongoProcessInstancePopulated = await transaction(async (session) => {
            await this.stepInstanceManager.updateStepsReviewers(stepsReviewers, session);

            const { steps: _steps, ...processData } = updatedData;
            return this.model
                .findByIdAndUpdate(id, processData, {
                    new: true,
                    session,
                })
                .populate(config.processFields.steps)
                .orFail(new InstanceNotFoundError('process', id))
                .lean<IMongoProcessInstancePopulated>();
        });

        await this.elasticSearchManager.updateDocumentOnElastic(updatedProcess);

        const activityLogUpdatedFields = currProcessTemplate.details.properties.properties
            ? Object.keys(currProcessTemplate.details.properties.properties)
                  .filter((key) => {
                      return updatedData.details?.[key] !== currProcess.details[key]; // compare between newValue to oldValue
                  })
                  .map((key) => {
                      return {
                          fieldName: key,
                          oldValue: currProcess.details[key] || '',
                          newValue: updatedData.details?.[key] || '',
                      };
                  })
            : [];

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.UPDATE_PROCESS,
            entityId: updatedProcess._id,
            timestamp: new Date(),
            metadata: { updatedFields: activityLogUpdatedFields },
            userId,
        });

        return updatedProcess;
    }

    getProcessStatus(process: IMongoProcessInstancePopulated, updatedStep?: IMongoStepInstance) {
        const steps = updatedStep ? process.steps.map((step) => (String(step._id) === String(updatedStep!._id) ? updatedStep : step)) : process.steps;
        if (steps.some((step) => step.status === Status.Rejected)) return Status.Rejected;
        return steps.some((step) => step.status === Status.Pending) ? Status.Pending : Status.Approved;
    }

    async deletePropertiesOfTemplate(
        templateId: string,
        removedProperties: {
            processProperties: string[];
            stepsProperties: Record<string, string[]>;
        },
        session?: ClientSession,
    ) {
        if (removedProperties.processProperties.length) {
            const unsetProcessFields = removedProperties.processProperties.reduce((acc, prop) => {
                acc[`details.${prop}`] = '';
                return acc;
            }, {});

            await this.model.updateMany({ templateId }, { $unset: unsetProcessFields }, { session });
        }

        const stepsUpdatePromises: Promise<UpdateWriteOpResult>[] = [];

        if (Object.values(removedProperties.stepsProperties).some((stepsProperties) => stepsProperties.length)) {
            Object.entries(removedProperties.stepsProperties).forEach(([stepId, stepRemovedProperties]) => {
                const unsetProcessFields = stepRemovedProperties.reduce((acc, prop) => {
                    acc[`properties.${prop}`] = '';
                    return acc;
                }, {});

                stepsUpdatePromises.push(this.stepInstanceManager.updateManySteps({ templateId: stepId }, { $unset: unsetProcessFields }, session));
            });
        }

        await Promise.all(stepsUpdatePromises);

        const updatedProcesses: IMongoProcessInstancePopulated[] = (await this.model
            .find({ templateId }, null, { session })
            .populate(config.processFields.steps)
            .lean()
            .exec()) as unknown as IMongoProcessInstancePopulated[];

        await Promise.all(
            updatedProcesses.map((updatedProcess) =>
                this.elasticSearchManager.updateDocumentOnElastic(updatedProcess as IMongoProcessInstancePopulated),
            ),
        );
    }

    async updateTemplate(id: string, updatedData: IMongoProcessTemplatePopulated): Promise<IMongoProcessTemplatePopulated> {
        const currProcessTemplate = await this.processTemplateManager.getProcessTemplateById(id);
        await this.processTemplateManager.throwIfCantUpdateProcessTemplate(updatedData, currProcessTemplate);

        return transaction(async (session) => {
            const removedProperties = this.processTemplateManager.getRemovedPropertiesFromTemplate(currProcessTemplate, updatedData);

            if (
                removedProperties.processProperties.length ||
                Object.values(removedProperties.stepsProperties).some((stepRemovedProperties) => stepRemovedProperties.length > 0)
            ) {
                await this.deletePropertiesOfTemplate(id, removedProperties, session);
            }

            return this.processTemplateManager.updateTemplate(id, updatedData, session);
        });
    }

    async archiveProcess(id: string, { archived }) {
        return this.model
            .findByIdAndUpdate(id, { archived }, { new: true })
            .populate(config.processFields.steps)
            .orFail(new InstanceNotFoundError('process', id))
            .lean();
    }

    async searchProcesses({
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
        isWaitingForMeFilterOn,
        isStepStatusPendeing,
        userId,
        ...restOfQuery
    }: IProcessInstanceSearchProperties) {
        const query: FilterQuery<ProcessInstanceDocument> = { ...restOfQuery };
        let processIds: (string | undefined)[] = [];
        if (archived !== undefined) query.archived = archived;
        if (templateIds) query.templateId = { $in: templateIds };
        if (startDate) query.startDate = { $gte: startDate };
        if (endDate) query.endDate = { $lte: endDate };
        if (ids) query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
        if (status) query.status = { $in: status };
        if (reviewerId) {
            if (isWaitingForMeFilterOn) {
                const waitingForMeProcesses = await searchAllowedProcessInstanceWaitForMe(this.model, query, reviewerId);
                if (isStepStatusPendeing) {
                    query._id = { $in: waitingForMeProcesses.map((process) => new Types.ObjectId(process._id)) };
                    return searchAllowedProcessInstanceForReviewerAggregation(this.model, query, reviewerId, 0, 0);
                }
                query._id = { $nin: waitingForMeProcesses.map((process) => new Types.ObjectId(process._id)) };
            }
            return searchAllowedProcessInstanceForReviewerAggregation(this.model, query, reviewerId, limit, skip);
        }

        if (searchText) {
            const count = await this.model.find({}).countDocuments();
            processIds = await this.elasticSearchManager.processGlobalSearch(searchText, count);
            query._id = { $in: processIds.map((id) => new Types.ObjectId(id)) };
        }

        if (isWaitingForMeFilterOn && userId) {
            const waitingForMeProcesses = await searchAllowedProcessInstanceWaitForMe(this.model, query, userId);
            const waitingForMeProcessIds = waitingForMeProcesses.map((process) => new Types.ObjectId(process._id));

            if (isStepStatusPendeing) {
                query._id = query._id ? { ...query._id, $in: waitingForMeProcessIds } : { $in: waitingForMeProcessIds };

                return searchAllowedProcessInstanceForReviewerAggregation(this.model, query, userId, 0, 0);
            }
            query._id = query._id ? { ...query._id, $nin: waitingForMeProcessIds } : { $nin: waitingForMeProcessIds };
        }

        const processes = await this.model
            .find(query, {}, { limit, skip, sort: { createdAt: -1 } })
            .populate(config.processFields.steps)
            .lean()
            .exec();

        if (processIds) processes.sort((a, b) => processIds.indexOf(a._id.toString()) - processIds.indexOf(b._id.toString()));
        return processes;
    }

    async updateStatus(id: string, status: Status, session?: ClientSession) {
        const { status: currStatus } = await this.getProcessById(id);
        if (currStatus === status) throw new ServiceError(undefined, `status of process has not changed, get the same status: ${status}`);
        return this.model.findByIdAndUpdate(id, { status, reviewedAt: new Date() }, { session });
    }
}

export default ProcessInstanceManager;
