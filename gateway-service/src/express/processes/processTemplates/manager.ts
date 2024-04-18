import { deleteFiles, uploadFiles } from '../../../externalServices/storageService';
import { removeTmpFile } from '../../../utils/fs';
import {
    IMongoProcessTemplatePopulated,
    IMongoProcessTemplateWithSteps,
    IProcessTemplateWithSteps,
    ISearchProcessTemplatesBody,
} from '../../../externalServices/processService/interfaces/processTemplate';
import { ProcessManagerService } from '../../../externalServices/processService';
import { IMongoStepTemplate, IStepTemplate } from '../../../externalServices/processService/interfaces/stepTemplate';
import { ServiceError } from '../../error';
import UsersManager from '../../users/manager';
import ProcessesInstancesManager from '../processInstances/manager';
import {
    IMongoProcessInstanceWithSteps,
    ISearchProcessInstancesBody,
    Status,
} from '../../../externalServices/processService/interfaces/processInstance';
import config from '../../../config';
import { isProcessManager } from '../../../externalServices/permissionsService';

const { internalSearchPullLimit } = config.processService;

export class ProcessTemplatesManager {
    private static async uploadIcons(icons: Express.Multer.File[]) {
        if (icons.length === 0) {
            return [];
        }

        const iconFileIds = await uploadFiles(icons);

        const iconFilePropertiesEntries = icons.map((icon, index) => {
            return [Number(icon.fieldname), iconFileIds[index]];
        });
        return iconFilePropertiesEntries;
    }

    static async getTemplateWithPopulatedStepReviewers(processTemplate: IMongoProcessTemplateWithSteps): Promise<IMongoProcessTemplatePopulated> {
        const populatedSteps = await Promise.all(processTemplate.steps.map((step) => this.populateStepWithReviewers(step)));
        return { ...processTemplate, steps: populatedSteps };
    }

    private static async populateStepWithReviewers(step: IMongoStepTemplate) {
        const populatedReviewers = await Promise.all(step.reviewers.map((id) => UsersManager.getUserById(id)));
        return { ...step, reviewers: populatedReviewers };
    }

    static async getProcessTemplate(id: string, userId: string) {
        const processTemplate = await ProcessManagerService.getProcessTemplateById(id, userId);
        return this.getTemplateWithPopulatedStepReviewers(processTemplate);
    }

    private static async removeUnusedIconFileIds(
        oldStepsIconFileIds: IStepTemplate['iconFileId'][],
        newStepsIconFileIds: IStepTemplate['iconFileId'][],
    ) {
        const oldFileIds = new Set(oldStepsIconFileIds.filter((id) => id !== null) as string[]);
        const newFileIds = new Set(newStepsIconFileIds.filter((id) => id !== null) as string[]);

        const idsToDelete = Array.from(oldFileIds).filter((id) => !newFileIds.has(id));
        if (idsToDelete.length) await deleteFiles(idsToDelete).catch(() => console.log(`failed to delete unused icons: ${idsToDelete}`)); // eslint-disable-line no-console
    }

    private static async handleIcons(icons: Express.Multer.File[], newSteps: IMongoStepTemplate[]) {
        const updatedSteps = [...newSteps];

        if (icons.length) {
            const iconFilesProperties = await ProcessTemplatesManager.uploadIcons(icons);
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

    static async createProcessTemplate(templateData: IProcessTemplateWithSteps, icons: Express.Multer.File[]) {
        const updatedSteps = await this.handleIcons(icons, templateData.steps);
        const processTemplate = await ProcessManagerService.createProcessTemplate({ ...templateData, steps: updatedSteps });
        return this.getTemplateWithPopulatedStepReviewers(processTemplate);
    }

    static async updateProcessTemplate(templateId: string, templateData: IProcessTemplateWithSteps, icons: Express.Multer.File[], userId: string) {
        const currProcessTemplate = await ProcessTemplatesManager.getProcessTemplate(templateId, userId);

        const updatedSteps = await this.handleIcons(icons, templateData.steps);
        await ProcessTemplatesManager.removeUnusedIconFileIds(
            currProcessTemplate.steps.map((step) => step.iconFileId),
            updatedSteps.map((step) => step.iconFileId),
        );

        const processTemplate = await ProcessManagerService.updateProcessTemplate(templateId, { ...templateData, steps: updatedSteps });
        const populatedProcessTemplate = await this.getTemplateWithPopulatedStepReviewers(processTemplate);

        this.sendProcessReviewerUpdateNotifications(populatedProcessTemplate, currProcessTemplate);

        return populatedProcessTemplate;
    }

    static async deleteProcessTemplate(templateId: string) {
        const deletedTemplate = await ProcessManagerService.deleteProcessTemplate(templateId);
        const { steps } = deletedTemplate;
        const iconsIds = steps.map((step) => {
            return step.iconFileId;
        });
        await deleteFiles(iconsIds.filter((id) => id !== null).map((id) => id!)).catch((err) => {
            // eslint-disable-next-line no-console
            console.log('failed to delete icons images');
            throw new ServiceError(500, `failed to delete process template, failed when deleting icon files: ${err}`);
        });
        return this.getTemplateWithPopulatedStepReviewers(deletedTemplate);
    }

    static async searchProcessTemplates(searchBody: ISearchProcessTemplatesBody, userId: string) {
        const query: ISearchProcessTemplatesBody = { ...searchBody };

        if (!(await isProcessManager(userId))) query.reviewerId = userId;

        const processes = await ProcessManagerService.searchProcessTemplates(query);
        return Promise.all(processes.map((process) => this.getTemplateWithPopulatedStepReviewers(process)));
    }

    private static async getInstancesOfTemplate(templateId: string, query: Omit<ISearchProcessInstancesBody, 'templateIds' | 'skip' | 'limit'> = {}) {
        const instances: IMongoProcessInstanceWithSteps[] = [];

        let instancesChunk: IMongoProcessInstanceWithSteps[];
        let skip = 0;

        do {
            // eslint-disable-next-line no-await-in-loop
            instancesChunk = await ProcessManagerService.searchProcessInstances({
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

    private static async sendProcessReviewerUpdateNotifications(
        processTemplate: IMongoProcessTemplatePopulated,
        previousProcessTemplate: IMongoProcessTemplatePopulated,
    ) {
        const processes = await this.getInstancesOfTemplate(processTemplate._id, { status: [Status.Pending] });

        ProcessesInstancesManager.sendProcessReviewerUpdateNotification(
            processes.map((process) => process._id),
            processTemplate.steps,
            previousProcessTemplate.steps,
        );
    }
}

export default ProcessTemplatesManager;
