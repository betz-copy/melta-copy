import { Document, FilterQuery } from 'mongoose';
import ProcessTemplateModel from './model';
import {
    IMongoProcessTemplate,
    IMongoProcessTemplatePopulated,
    IProcessSingleProperty,
    IProcessTemplatePopulated,
    IProcessTemplateSearchProperties,
    ProcessTemplateDocument,
} from './interface';
import { TemplateNotFoundError, ServiceError } from '../../error';
import { escapeRegExp } from '../../../utils';
import ProcessInstanceManager from '../../instances/processes/manager';
import { transaction } from '../../../utils/mongoose';
import StepTemplateManager from '../steps/manager';
import config from '../../../config';

type ProcessTemplateType<T extends boolean> = T extends true ? IMongoProcessTemplatePopulated & Document : IMongoProcessTemplate & Document;

class ProcessTemplateManager {
    static async getAllTemplates() {
        return ProcessTemplateModel.find().populate(config.processFields.steps);
    }

    static async getProcessTemplateById<T extends boolean = true>(id: string, shouldPopulate: T = true as T): Promise<ProcessTemplateType<T>> {
        const query = ProcessTemplateModel.findById(id).orFail(new TemplateNotFoundError('process', id)).lean();
        return (shouldPopulate ? query.populate(config.processFields.steps) : query).exec() as Promise<ProcessTemplateType<T>>;
    }

    static async createProcessTemplate(processTemplate: IProcessTemplatePopulated): Promise<IMongoProcessTemplatePopulated> {
        const templateId: string = await transaction(async (session) => {
            const steps = await StepTemplateManager.createStepsTemplates(processTemplate.steps, session);
            const stepsIds = steps.map((step) => step._id);
            // mongoose create doesn't work well with sessions,the first argument must be an array
            // so use insertMany instead and pass array of one process.
            const [{ _id }] = await ProcessTemplateModel.insertMany([{ ...processTemplate, steps: stepsIds }], { session });
            return _id;
        });
        return this.getProcessTemplateById(templateId);
    }

    static async throwIfProcessTemplateHasInstances(templateId: string) {
        const processInstances = await ProcessInstanceManager.getProcessesByTemplateId(templateId).catch(() => {});
        if (processInstances) throw new ServiceError(400, 'process template still has instances');
    }

    static async deleteProcessTemplate(id: string): Promise<IMongoProcessTemplatePopulated> {
        const processTemplateToDelete = await this.getProcessTemplateById(id, false);
        await ProcessTemplateManager.throwIfProcessTemplateHasInstances(id);
        return transaction(async (session) => {
            await StepTemplateManager.deleteStepsByIds(processTemplateToDelete.steps, session);
            return ProcessTemplateModel.findByIdAndDelete(id)
                .orFail(new TemplateNotFoundError('process', id))
                .populate(config.processFields.steps)
                .lean();
        });
    }

    private static validateProperties(
        updatedProperties: Record<string, IProcessSingleProperty>,
        currProperties: Record<string, IProcessSingleProperty>,
    ) {
        Object.entries(currProperties).forEach(([key, value]) => {
            const newValue = updatedProperties[key];
            if (!newValue) throw new ServiceError(400, 'can not remove property');
            if (value.type !== newValue.type) throw new ServiceError(400, 'can not change property type');
            if (value.format !== newValue.format) throw new ServiceError(400, 'can not change property format');
            if (value.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                throw new ServiceError(400, 'can not remove options from enum');
        });
    }

    private static async throwIfCantUpdateProcessTemplate(updatedTemplate: IProcessTemplatePopulated, currTemplate: IMongoProcessTemplatePopulated) {
        const processInstances = await ProcessInstanceManager.searchProcesses({ templateIds: [currTemplate._id], limit: 0, skip: 0 });
        if (processInstances.length === 0) {
            return;
        }

        const { details: updatedDetails, summaryDetails: updatedSummary, name: updatedName, steps: updatedSteps } = updatedTemplate;
        if (updatedName !== currTemplate.name) throw new ServiceError(400, 'can not change step template name');
        this.validateProperties(updatedDetails.properties.properties, currTemplate.details.properties.properties);
        this.validateProperties(updatedSummary.properties.properties, currTemplate.summaryDetails.properties.properties);
        if (updatedSteps.length !== currTemplate.steps.length) throw new ServiceError(400, 'can not delete or add steps');
        updatedSteps.forEach((step, index) => {
            const currStep = currTemplate.steps[index];
            if (step.name !== currStep.name) throw new ServiceError(400, `can not change step[${index}] name`);
            this.validateProperties(step.properties.properties, currStep.properties.properties);
        });
    }

    static async updateTemplate(id: string, updatedData: IMongoProcessTemplatePopulated): Promise<IMongoProcessTemplatePopulated> {
        const currProcessTemplate = await this.getProcessTemplateById(id);
        this.throwIfCantUpdateProcessTemplate(updatedData, currProcessTemplate);
        return transaction(async (session) => {
            await StepTemplateManager.updateStepsTemplates(updatedData.steps, session);
            const stepsIds = updatedData.steps.map((step) => {
                return step._id;
            });
            return ProcessTemplateModel.findByIdAndUpdate(id, { ...updatedData, steps: stepsIds }, { new: true, session })
                .populate(config.processFields.steps)
                .orFail(new TemplateNotFoundError('process', id))
                .lean();
        });
    }

    static async searchTemplates({ displayName, ids, limit, skip }: IProcessTemplateSearchProperties) {
        const query: FilterQuery<ProcessTemplateDocument> = {};

        if (displayName) query.displayName = { $regex: escapeRegExp(displayName) };
        if (ids) query._id = { $in: ids };

        return ProcessTemplateModel.find(query, {}, { limit, skip }).populate(config.processFields.steps).lean().exec();
    }
}

export default ProcessTemplateManager;
