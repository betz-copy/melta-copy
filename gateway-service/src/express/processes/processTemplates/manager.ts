import { UploadedFile } from '@packages/entity';
import { PermissionScope } from '@packages/permission';
import {
    IMongoProcessInstancePopulated,
    IMongoProcessTemplatePopulated,
    IMongoProcessTemplateReviewerPopulated,
    IMongoStepTemplate,
    IProcessInstanceSearchProperties,
    IProcessTemplatePopulated,
    ISearchProcessTemplatesBody,
    IStepTemplate,
    Status,
} from '@packages/process';
import { IReqUser } from '@packages/user';
import { ServiceError } from '@packages/utils';
import { logger } from 'elastic-apm-node';
import config from '../../../config';
import ProcessService from '../../../externalServices/processService';
import StorageService from '../../../externalServices/storageService';
import { Authorizer } from '../../../utils/authorizer';
import DefaultManagerProxy from '../../../utils/express/manager';
import UsersManager from '../../users/manager';
import ProcessesInstancesManager from '../processInstances/manager';

const { internalSearchPullLimit } = config.processService;

export class ProcessTemplatesManager extends DefaultManagerProxy<ProcessService> {
    private storageService: StorageService;

    private processInstancesManager: ProcessesInstancesManager;

    constructor(private workspaceId: string) {
        super(new ProcessService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.processInstancesManager = new ProcessesInstancesManager(workspaceId);
    }

    private async uploadIcons(icons: UploadedFile[]) {
        if (icons.length === 0) {
            return [];
        }

        const iconFileIds = await this.storageService.uploadFiles(icons);

        const iconFilePropertiesEntries = icons.map((icon, index) => {
            return [Number(icon.fieldname), iconFileIds[index]];
        });
        return iconFilePropertiesEntries;
    }

    async getTemplateWithPopulatedStepReviewers(processTemplate: IMongoProcessTemplatePopulated): Promise<IMongoProcessTemplateReviewerPopulated> {
        const populatedSteps = await Promise.all(processTemplate.steps.map((step) => this.populateStepWithReviewers(step)));
        return { ...processTemplate, steps: populatedSteps };
    }

    private async populateStepWithReviewers(step: IMongoStepTemplate) {
        const populatedReviewers = await Promise.all(step.reviewers.map((id) => UsersManager.getUserById(id)));
        return { ...step, reviewers: populatedReviewers };
    }

    async getProcessTemplate(id: string, user: IReqUser) {
        const processTemplate = await this.service.getProcessTemplateById(id, user);
        return this.getTemplateWithPopulatedStepReviewers(processTemplate);
    }

    private async removeUnusedIconFileIds(oldStepsIconFileIds: IStepTemplate['iconFileId'][], newStepsIconFileIds: IStepTemplate['iconFileId'][]) {
        const oldFileIds = new Set(oldStepsIconFileIds.filter((id) => id !== null) as string[]);
        const newFileIds = new Set(newStepsIconFileIds.filter((id) => id !== null) as string[]);

        const idsToDelete = Array.from(oldFileIds).filter((id) => !newFileIds.has(id));
        if (idsToDelete.length)
            await this.storageService.deleteFiles(idsToDelete).catch((error) => {
                throw new ServiceError(undefined, `failed to delete unused icons: ${idsToDelete}`, { error });
            });
    }

    private async handleIcons(icons: UploadedFile[], newSteps: IMongoStepTemplate[]) {
        const updatedSteps = [...newSteps];

        if (icons.length) {
            const iconFilesProperties = await this.uploadIcons(icons);
            iconFilesProperties.forEach(([stepIndex, iconFileId]) => {
                if (updatedSteps[stepIndex]) updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], iconFileId };
            });
        }
        return updatedSteps;
    }

    async createProcessTemplate(templateData: IProcessTemplatePopulated, icons: UploadedFile[]) {
        const updatedSteps = await this.handleIcons(icons, templateData.steps);
        const processTemplate = await this.service.createProcessTemplate({ ...templateData, steps: updatedSteps });
        return this.getTemplateWithPopulatedStepReviewers(processTemplate);
    }

    private async getFilesPathOfDeletedProperty(
        templateId: string,
        removedFileProperties: {
            processProperties: Record<string, boolean>;
            stepsProperties: Record<string, Record<string, boolean>>;
        },
    ) {
        const processesInstances = await this.getInstancesOfTemplate(templateId);

        const filePaths: string[] = [];

        processesInstances.forEach((processInstance) => {
            Object.entries(removedFileProperties.processProperties).forEach(([filePropertyName, isMultipleFiles]) => {
                const fileToRemove = processInstance.details[filePropertyName];

                if (fileToRemove) {
                    if (isMultipleFiles) filePaths.push(...fileToRemove);
                    else filePaths.push(fileToRemove);
                }
            });

            Object.keys(removedFileProperties.stepsProperties).forEach((stepId) => {
                const stepWithFilesToRemove = processInstance.steps.find((step) => step.templateId === stepId);

                if (stepWithFilesToRemove?.properties) {
                    Object.entries(removedFileProperties.stepsProperties[stepId]).forEach(([filePropertyName, isMultipleFiles]) => {
                        const fileToRemove = stepWithFilesToRemove.properties![filePropertyName];

                        if (fileToRemove) {
                            if (isMultipleFiles) filePaths.push(...fileToRemove);
                            else filePaths.push(fileToRemove);
                        }
                    });
                }
            });
        });

        return filePaths;
    }

    async getFilePathsOfProcessInstancesToDelete(
        currProcessTemplate: IMongoProcessTemplateReviewerPopulated,
        updatedProcessTemplate: IProcessTemplatePopulated,
    ) {
        const removedFileProperties: {
            processProperties: Record<string, boolean>;
            stepsProperties: Record<string, Record<string, boolean>>;
        } = {
            processProperties: {},
            stepsProperties: {},
        };

        Object.entries(currProcessTemplate.details.properties.properties).forEach(([key, value]) => {
            const newValue = updatedProcessTemplate.details.properties.properties[key];
            const { format, items } = value;

            if (!newValue && (format === 'fileId' || items?.format === 'fileId')) {
                removedFileProperties.processProperties[key] = items?.format === 'fileId';
            }
        });

        currProcessTemplate.steps.forEach((step, index) => {
            removedFileProperties.stepsProperties[step._id] = {};
            Object.entries(step.properties.properties).forEach(([key, value]) => {
                const newValue = updatedProcessTemplate.steps[index].properties.properties[key];
                const { format, items } = value;

                if (!newValue && (format === 'fileId' || items?.format === 'fileId')) {
                    removedFileProperties.stepsProperties[step._id][key] = items?.format === 'fileId';
                }
            });
        });

        if (
            Object.keys(removedFileProperties.processProperties).length ||
            Object.values(removedFileProperties.stepsProperties).some((stepRemovedProperties) => Object.keys(stepRemovedProperties).length > 0)
        ) {
            return this.getFilesPathOfDeletedProperty(currProcessTemplate._id, removedFileProperties); // TODO - what happens if the delete properties after that is failed..
        }

        return [];
    }

    async updateProcessTemplate(templateId: string, templateData: IProcessTemplatePopulated, icons: UploadedFile[], user: IReqUser) {
        const currProcessTemplate = await this.getProcessTemplate(templateId, user);

        const updatedSteps = await this.handleIcons(icons, templateData.steps);
        await this.removeUnusedIconFileIds(
            currProcessTemplate.steps.map((step) => step.iconFileId),
            updatedSteps.map((step) => step.iconFileId),
        );

        const filePathsOfFilesToDelete = await this.getFilePathsOfProcessInstancesToDelete(currProcessTemplate, {
            ...templateData,
            steps: updatedSteps,
        });

        const processTemplate = await this.service.updateProcessTemplate(templateId, { ...templateData, steps: updatedSteps });
        const populatedProcessTemplate = await this.getTemplateWithPopulatedStepReviewers(processTemplate);

        if (filePathsOfFilesToDelete.length) {
            await this.storageService.deleteFiles(filePathsOfFilesToDelete).catch((error) => {
                logger.error('Failed to delete files', filePathsOfFilesToDelete, error);
            });
        }

        this.sendProcessReviewerUpdateNotifications(populatedProcessTemplate, currProcessTemplate);

        return populatedProcessTemplate;
    }

    async deleteProcessTemplate(templateId: string) {
        const deletedTemplate = await this.service.deleteProcessTemplate(templateId);
        const { steps } = deletedTemplate;
        const iconsIds = steps.map((step) => {
            return step.iconFileId;
        });
        await this.storageService.deleteFiles(iconsIds.filter((id) => id !== null).map((id) => id!)).catch((error) => {
            throw new ServiceError(undefined, 'failed to delete icons images', { error });
        });
        return this.getTemplateWithPopulatedStepReviewers(deletedTemplate);
    }

    async searchProcessTemplates(searchBody: ISearchProcessTemplatesBody, user: IReqUser) {
        const query: ISearchProcessTemplatesBody = { ...searchBody };

        const userPermissions = await new Authorizer(this.workspaceId).getWorkspacePermissions(user);

        if (!userPermissions.admin?.scope && userPermissions.processes?.scope !== PermissionScope.write) {
            query.reviewerId = user._id;
        }

        const processes = await this.service.searchProcessTemplates(query);
        return Promise.all(processes.map((process) => this.getTemplateWithPopulatedStepReviewers(process)));
    }

    private async getInstancesOfTemplate(templateId: string, query: Omit<IProcessInstanceSearchProperties, 'templateIds' | 'skip' | 'limit'> = {}) {
        const instances: IMongoProcessInstancePopulated[] = [];

        let instancesChunk: IMongoProcessInstancePopulated[];
        let skip = 0;

        do {
            instancesChunk = await this.service.searchProcessInstances({
                ...query,
                templateIds: [templateId],
                skip,
                limit: internalSearchPullLimit,
            });
            instances.push(...instancesChunk);

            skip += internalSearchPullLimit;
        } while (instancesChunk.length);

        return instances;
    }

    private async sendProcessReviewerUpdateNotifications(
        processTemplate: IMongoProcessTemplateReviewerPopulated,
        previousProcessTemplate: IMongoProcessTemplateReviewerPopulated,
    ) {
        const processes = await this.getInstancesOfTemplate(processTemplate._id, { status: [Status.Pending] });

        this.processInstancesManager.sendProcessReviewerUpdateNotification(
            processes.map((process) => process._id),
            processTemplate.steps,
            previousProcessTemplate.steps,
        );
    }
}

export default ProcessTemplatesManager;
