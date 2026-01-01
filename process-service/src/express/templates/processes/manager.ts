import {
    DefaultManagerMongo,
    IMongoProcessTemplate,
    IMongoProcessTemplatePopulated,
    IProcessSingleProperty,
    IProcessTemplate,
    IProcessTemplatePopulated,
    IProcessTemplateSearchProperties,
    ServiceError,
} from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';
import { ClientSession, FilterQuery, Types } from 'mongoose';
import config from '../../../config';
import { escapeRegExp } from '../../../utils';
import { getProcessTemplatesByReviewerIdAggregation, transaction } from '../../../utils/mongo';
import { TemplateNotFoundError } from '../../error';
import ProcessInstanceManager from '../../instances/processes/manager';
import StepTemplateManager from '../steps/manager';
import { ProcessTemplateSchema } from './model';

type ProcessTemplateType<T extends boolean> = T extends true ? IMongoProcessTemplatePopulated : IMongoProcessTemplate;

const { BAD_REQUEST: badRequestStatus } = StatusCodes;

export default class ProcessTemplateManager extends DefaultManagerMongo<IProcessTemplate> {
    public stepTemplateManager: StepTemplateManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.processTemplatesCollectionName, ProcessTemplateSchema);
        this.stepTemplateManager = new StepTemplateManager(workspaceId);
    }

    async getProcessTemplateById<T extends boolean = true>(id: string, shouldPopulate: T = true as T): Promise<ProcessTemplateType<T>> {
        const query = this.model.findById(id).orFail(new TemplateNotFoundError('process', id)).lean();
        return (shouldPopulate ? query.populate(config.processFields.steps) : query).exec() as unknown as Promise<ProcessTemplateType<T>>;
    }

    async createProcessTemplate(processTemplate: IProcessTemplatePopulated): Promise<IMongoProcessTemplatePopulated> {
        const templateId: string = await transaction(async (session) => {
            const steps = await this.stepTemplateManager.createStepsTemplates(processTemplate.steps, session);
            const stepsIds = steps.map((step) => step._id);
            // mongoose create doesn't work well with sessions,the first argument must be an array
            // so use insertMany instead and pass array of one process.
            const [{ _id }] = await this.model.insertMany([{ ...processTemplate, steps: stepsIds }], { session });
            return _id!.toString();
        });
        return this.getProcessTemplateById(templateId);
    }

    async throwIfProcessTemplateHasInstances(templateId: string) {
        const processInstanceManager = new ProcessInstanceManager(this.workspaceId);
        const processInstances = await processInstanceManager.getProcessesByTemplateId(templateId).catch(() => {});
        if (processInstances) throw new ServiceError(badRequestStatus, 'process template still has instances');
    }

    async deleteProcessTemplate(id: string): Promise<IMongoProcessTemplatePopulated> {
        const processTemplateToDelete = await this.getProcessTemplateById(id, false);
        await this.throwIfProcessTemplateHasInstances(id);
        return transaction(async (session) => {
            await this.stepTemplateManager.deleteStepsByIds(processTemplateToDelete.steps, session);
            return this.model
                .findByIdAndDelete(id)
                .orFail(new TemplateNotFoundError('process', id))
                .populate(config.processFields.steps)
                .lean<IMongoProcessTemplatePopulated>();
        });
    }

    private validateProperties(
        updatedProperties: Record<string, IProcessSingleProperty>,
        currProperties: Record<string, IProcessSingleProperty>,
        updatedPropertiesRequired: string[] = [],
        currPropertiesRequired: string[] = [],
    ) {
        if (updatedPropertiesRequired.some((reqField) => !currPropertiesRequired.includes(reqField))) {
            throw new ServiceError(badRequestStatus, 'can not update required field');
        }

        Object.entries(currProperties).forEach(([key, value]) => {
            const newValue = updatedProperties[key];
            if (newValue) {
                if (value.type !== newValue.type) throw new ServiceError(badRequestStatus, 'can not change property type');
                if (
                    !(
                        (value.format === 'text-area' && !newValue.format && newValue.type === 'string') ||
                        (!value.format && value.type === 'string' && newValue.format === 'text-area') ||
                        value.format === newValue.format
                    )
                )
                    throw new ServiceError(badRequestStatus, 'can not change property format');
                if (value.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                    throw new ServiceError(badRequestStatus, 'can not remove options from enum');
            }
        });
    }

    async throwIfCantUpdateProcessTemplate(updatedTemplate: IProcessTemplatePopulated, currTemplate: IMongoProcessTemplatePopulated) {
        const processInstanceManager = new ProcessInstanceManager(this.workspaceId);
        const processInstances = await processInstanceManager.searchProcesses({ templateIds: [currTemplate._id], limit: 0, skip: 0 });
        if (processInstances.length === 0) {
            return;
        }

        const { details: updatedDetails, name: updatedName, steps: updatedSteps } = updatedTemplate;
        if (updatedName !== currTemplate.name) throw new ServiceError(badRequestStatus, 'can not change step template name');
        this.validateProperties(
            updatedDetails.properties.properties,
            currTemplate.details.properties.properties,
            updatedDetails.properties.required,
            currTemplate.details.properties.required,
        );

        if (updatedSteps.length !== currTemplate.steps.length) throw new ServiceError(badRequestStatus, 'can not delete or add steps');

        updatedSteps.forEach((step, index) => {
            const currStep = currTemplate.steps.find((currTemplateStep) => step._id.toString() === currTemplateStep._id.toString());
            if (!currStep) throw new ServiceError(badRequestStatus, `can not add new step id ${step._id})`);
            if (step.name !== currStep.name) throw new ServiceError(badRequestStatus, `can not change step[${index}] name`);
            this.validateProperties(
                step.properties.properties,
                currStep.properties.properties,
                step.properties.required,
                currStep.properties.required,
            );
        });
    }

    getRemovedPropertiesFromTemplate(currProcessTemplate: IMongoProcessTemplatePopulated, updatedData: IMongoProcessTemplatePopulated) {
        const removedProperties: {
            processProperties: string[];
            stepsProperties: Record<string, string[]>;
        } = {
            processProperties: [],
            stepsProperties: {},
        };

        Object.entries(currProcessTemplate.details.properties.properties).forEach(([key, _value]) => {
            const newValue = updatedData.details.properties.properties[key];

            if (!newValue) removedProperties.processProperties.push(key);
        });

        currProcessTemplate.steps.forEach((step, index) => {
            removedProperties.stepsProperties[step._id] = [];
            Object.keys(step.properties.properties).forEach((key) => {
                const newValue = updatedData.steps[index].properties.properties[key];

                if (!newValue) removedProperties.stepsProperties[step._id].push(key);
            });
        });

        return removedProperties;
    }

    async updateTemplate(id: string, updatedData: IMongoProcessTemplatePopulated, session: ClientSession): Promise<IMongoProcessTemplatePopulated> {
        const stepsIds = await this.stepTemplateManager.updateStepsTemplates(updatedData.steps, session);
        return this.model
            .findByIdAndUpdate(id, { ...updatedData, steps: stepsIds }, { new: true, session })
            .populate<IMongoProcessTemplatePopulated>(config.processFields.steps)
            .orFail(new TemplateNotFoundError('process', id))
            .lean();
    }

    async searchTemplates({ displayName, ids, limit, skip, reviewerId }: IProcessTemplateSearchProperties) {
        const query: FilterQuery<IMongoProcessTemplate> = {};

        if (displayName) query.displayName = { $regex: escapeRegExp(displayName) };
        if (ids) query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
        if (reviewerId) {
            return getProcessTemplatesByReviewerIdAggregation(this.model, query, reviewerId, limit, skip);
        }

        return this.model.find(query, {}, { limit, skip }).populate(config.processFields.steps).lean().exec();
    }
}
