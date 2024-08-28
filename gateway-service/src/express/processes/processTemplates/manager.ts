import config from '../../../config';
import { ProcessService } from '../../../externalServices/processService';
import {
    IMongoProcessInstanceWithSteps,
    ISearchProcessInstancesBody,
    Status,
} from '../../../externalServices/processService/interfaces/processInstance';
import {
    IMongoProcessTemplatePopulated,
    IMongoProcessTemplateWithSteps,
    IProcessTemplateWithSteps,
    ISearchProcessTemplatesBody,
} from '../../../externalServices/processService/interfaces/processTemplate';
import { IMongoStepTemplate, IStepTemplate } from '../../../externalServices/processService/interfaces/stepTemplate';
import { StorageService } from '../../../externalServices/storageService';
import { PermissionScope } from '../../../externalServices/userService/interfaces/permissions';
import { Authorizer } from '../../../utils/authorizer';
import DefaultManagerProxy from '../../../utils/express/manager';
import { removeTmpFile } from '../../../utils/fs';
import logger from '../../../utils/logger/logsLogger';
import { ServiceError } from '../../error';
import { UsersManager } from '../../users/manager';
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

    private async uploadIcons(icons: Express.Multer.File[]) {
        if (icons.length === 0) {
            return [];
        }

        const iconFileIds = await this.storageService.uploadFiles(icons);

        const iconFilePropertiesEntries = icons.map((icon, index) => {
            return [Number(icon.fieldname), iconFileIds[index]];
        });
        return iconFilePropertiesEntries;
    }

    async getTemplateWithPopulatedStepReviewers(processTemplate: IMongoProcessTemplateWithSteps): Promise<IMongoProcessTemplatePopulated> {
        const populatedSteps = await Promise.all(processTemplate.steps.map((step) => this.populateStepWithReviewers(step)));
        return { ...processTemplate, steps: populatedSteps };
    }

    private async populateStepWithReviewers(step: IMongoStepTemplate) {
        const populatedReviewers = await Promise.all(step.reviewers.map((id) => UsersManager.getUserById(id)));
        return { ...step, reviewers: populatedReviewers };
    }

    async getProcessTemplate(id: string, userId: string) {
        const processTemplate = await this.service.getProcessTemplateById(id, userId);
        return this.getTemplateWithPopulatedStepReviewers(processTemplate);
    }

    private async removeUnusedIconFileIds(oldStepsIconFileIds: IStepTemplate['iconFileId'][], newStepsIconFileIds: IStepTemplate['iconFileId'][]) {
        const oldFileIds = new Set(oldStepsIconFileIds.filter((id) => id !== null) as string[]);
        const newFileIds = new Set(newStepsIconFileIds.filter((id) => id !== null) as string[]);

        const idsToDelete = Array.from(oldFileIds).filter((id) => !newFileIds.has(id));
        if (idsToDelete.length)
            await this.storageService.deleteFiles(idsToDelete).catch(() => logger.error(`failed to delete unused icons: ${idsToDelete}`));
    }

    private async handleIcons(icons: Express.Multer.File[], newSteps: IMongoStepTemplate[]) {
        const updatedSteps = [...newSteps];

        if (icons.length) {
            const iconFilesProperties = await this.uploadIcons(icons);
            iconFilesProperties.forEach(([stepIndex, iconFileId]) => {
                if (updatedSteps[stepIndex]) updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], iconFileId };
            });
            await Promise.all(
                icons.map((iconFile) => {
                    return removeTmpFile(iconFile.path);
                }),
            );
        }
        return updatedSteps;
    }

    async createProcessTemplate(templateData: IProcessTemplateWithSteps, icons: Express.Multer.File[]) {
        const updatedSteps = await this.handleIcons(icons, templateData.steps);
        const processTemplate = await this.service.createProcessTemplate({ ...templateData, steps: updatedSteps });
        return this.getTemplateWithPopulatedStepReviewers(processTemplate);
    }

    async updateProcessTemplate(templateId: string, templateData: IProcessTemplateWithSteps, icons: Express.Multer.File[], userId: string) {
        const currProcessTemplate = await this.getProcessTemplate(templateId, userId);

        const updatedSteps = await this.handleIcons(icons, templateData.steps);
        await this.removeUnusedIconFileIds(
            currProcessTemplate.steps.map((step) => step.iconFileId),
            updatedSteps.map((step) => step.iconFileId),
        );

        const processTemplate = await this.service.updateProcessTemplate(templateId, { ...templateData, steps: updatedSteps });
        const populatedProcessTemplate = await this.getTemplateWithPopulatedStepReviewers(processTemplate);

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
            logger.error('failed to delete icons images', { error });
            throw new ServiceError(500, `failed to delete process template, failed when deleting icon files: ${error}`);
        });
        return this.getTemplateWithPopulatedStepReviewers(deletedTemplate);
    }

    async searchProcessTemplates(searchBody: ISearchProcessTemplatesBody, userId: string) {
        const query: ISearchProcessTemplatesBody = { ...searchBody };

        const userPermissions = await new Authorizer(this.workspaceId).getWorkspacePermissions(userId);

        if (!userPermissions.admin?.scope && userPermissions.processes?.scope !== PermissionScope.write) {
            query.reviewerId = userId;
        }

        const processes = await this.service.searchProcessTemplates(query);
        return Promise.all(processes.map((process) => this.getTemplateWithPopulatedStepReviewers(process)));
    }

    private async getInstancesOfTemplate(templateId: string, query: Omit<ISearchProcessInstancesBody, 'templateIds' | 'skip' | 'limit'> = {}) {
        const instances: IMongoProcessInstanceWithSteps[] = [];

        let instancesChunk: IMongoProcessInstanceWithSteps[];
        let skip = 0;

        do {
            // eslint-disable-next-line no-await-in-loop
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
        processTemplate: IMongoProcessTemplatePopulated,
        previousProcessTemplate: IMongoProcessTemplatePopulated,
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
