import { deleteFiles } from '../../../externalServices/storageService';
import { ProcessManagerService } from '../../../externalServices/processService';
import {
    IMongoProcessInstancePopulated,
    IMongoProcessInstanceWithSteps,
    InstanceProperties,
    IProcessInstance,
    IReferencedEntityForProcess,
    ISearchProcessInstancesBody,
    Status,
} from '../../../externalServices/processService/interfaces/processInstance';
import { InstancesManager } from '../../instances/manager';
import { IProcessDetails, PropertyFormats } from '../../../externalServices/processService/interfaces/processTemplate';
import { removeTmpFile } from '../../../utils/fs';
import { ServiceError } from '../../error';
import { NotificationService } from '../../../externalServices/notificationService';
import {
    IArchiveProcessNotificationMetadata,
    IDeleteProcessNotificationMetadata,
    INewProcessNotificationMetadata,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadata,
    NotificationType,
} from '../../../externalServices/notificationService/interfaces';
import { getPermissions, isProcessManager } from '../../../externalServices/permissionsApi';
import { filteredMap } from '../../../utils';
import { IGenericStep } from '../../../externalServices/processService/interfaces';
import { IMongoStepInstance } from '../../../externalServices/processService/interfaces/stepInstance';
import { InstanceManagerService } from '../../../externalServices/instanceManager';
import { EntityNotExist, NotFoundError } from '../error';
import { EntityTemplateManagerService } from '../../../externalServices/entityTemplateManager';
import PermissionsManager from '../../permissions/manager';
import StepsInstancesManager from '../stepInstances/manager';
import { IMongoStepTemplate } from '../../../externalServices/processService/interfaces/stepTemplate';

export default class ProcessesInstancesManager {
    static async getPropertiesWithEntities(properties: InstanceProperties, template: IProcessDetails['properties'], userId: string) {
        const updatedProperties: InstanceProperties = { ...properties };

        const entityProperties = Object.entries(template.properties).filter(
            ([key, value]) => value.format === PropertyFormats.EntityReference && properties[key] !== undefined,
        );

        if (entityProperties.length === 0) return properties;

        const userPermissionPromise = PermissionsManager.getPermissionsOfUser(userId);

        const promises = entityProperties.map(([key]) => {
            const entityPromise = InstanceManagerService.getEntityInstanceById(properties[key]);
            const entityTemplatePromise = entityPromise.then((entity) => EntityTemplateManagerService.getEntityTemplateById(entity.templateId));

            return Promise.all([entityPromise, entityTemplatePromise, userPermissionPromise]).then(([entity, entityTemplate, userPermission]) => {
                updatedProperties[key] = {
                    entity,
                    userHavePermission: Boolean(
                        userPermission.instancesPermissions.find((instance) => instance.category === entityTemplate.category._id),
                    ),
                    entityTemplate,
                } as IReferencedEntityForProcess;
            });
        });

        await Promise.all(promises);

        return updatedProperties;
    }

    private static async getPopulatedProcess(process: IMongoProcessInstanceWithSteps, userId: string): Promise<IMongoProcessInstancePopulated> {
        const processTemplate = await ProcessManagerService.getProcessTemplateById(process.templateId);
        const details = await this.getPropertiesWithEntities(process.details, processTemplate.details.properties, userId);

        const result = await Promise.all(
            process.steps.map((step) => StepsInstancesManager.getStepInstanceWithEntitesAndReviewers(step, userId)),
        ).then(async (populatedSteps) => {
            const populatedProcess = {
                ...process,
                details,
                steps: populatedSteps,
            };

            return populatedProcess;
        });
        return result;
    }

    static async getProcessInstance(id: string, userId: string) {
        const process = await ProcessManagerService.getProcessInstanceById(id, userId);
        return this.getPopulatedProcess(process, userId);
    }

    static async getProcessInstanceOrNull(id: string, userId: string) {
        try {
            const process = await ProcessManagerService.getProcessInstanceById(id, userId);
            return this.getPopulatedProcess(process, userId);
        } catch (error: any) {
            if (error instanceof NotFoundError && error.code === 404) return null;
            throw error;
        }
    }

    static async checkEntityReferenceFields(properties: InstanceProperties, schema: IProcessDetails['properties']) {
        await Promise.all(
            Object.entries(schema.properties).map(async ([key, value]) => {
                if (value.format === PropertyFormats.EntityReference && properties[key] !== undefined) {
                    try {
                        await InstanceManagerService.getEntityInstanceById(properties[key]);
                    } catch {
                        throw new EntityNotExist(properties[key]);
                    }
                }
            }),
        );
    }

    static async createProcessInstance(processData: IProcessInstance, files: Express.Multer.File[], userId: string) {
        const processTemplate = await ProcessManagerService.getProcessTemplateById(processData.templateId);

        this.checkEntityReferenceFields(processData.details, processTemplate.details.properties);
        if (!files.length) {
            const process = await ProcessManagerService.createProcessInstance(processData);

            await Promise.allSettled([
                this.sendNewProcessNotification(process._id),
                this.sendProcessReviewerUpdateNotifications([process._id], process.steps),
            ]);
            return this.getPopulatedProcess(process, userId);
        }
        const filesProperties = await InstancesManager.uploadInstanceFiles(files);
        const processDetails = { ...processData.details, ...filesProperties };

        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );

        const process = await ProcessManagerService.createProcessInstance({ ...processData, details: processDetails }).catch(async (error) => {
            await deleteFiles(Object.values(filesProperties)).catch(() => {
                // eslint-disable-next-line no-console
                console.log('failed to delete process unused files');
            });
            throw error;
        });

        await Promise.allSettled([
            this.sendNewProcessNotification(process._id),
            this.sendProcessReviewerUpdateNotifications([process._id], process.steps),
        ]);
        return this.getPopulatedProcess(process, userId);
    }

    static async removeUnusedFileIds(
        templateProperties: IProcessDetails['properties'],
        oldProperties: Record<string, any>,
        newProperties: Record<string, any>,
    ) {
        const oldFileIds = new Set<string>(this.extractFileIdsFromProperties(templateProperties, oldProperties));
        const newFileIds = new Set<string>(this.extractFileIdsFromProperties(templateProperties, newProperties));

        const idsToDelete = Array.from(oldFileIds).filter((id) => !newFileIds.has(id));
        // eslint-disable-next-line no-console
        if (idsToDelete.length) await deleteFiles(idsToDelete).catch(() => console.log(`failed to delete unused files: ${idsToDelete}`));
    }

    static async updateProcessInstance(processId: string, processData: IProcessInstance, files: Express.Multer.File[], userId: string) {
        const currProcessInstance = await ProcessManagerService.getProcessInstanceById(processId);
        const processTemplate = await ProcessManagerService.getProcessTemplateById(currProcessInstance.templateId);

        if (processData.details) this.checkEntityReferenceFields(processData.details, processTemplate.details.properties);
        if (!files.length) {
            const updatedProcess = await ProcessManagerService.updateProcessInstance(processId, processData);
            await Promise.allSettled([
                this.sendProcessReviewerUpdateNotifications([updatedProcess._id], updatedProcess.steps, currProcessInstance.steps),
            ]);
            return this.getPopulatedProcess(updatedProcess, userId);
        }

        const filesProperties = await InstancesManager.uploadInstanceFiles(files);

        const updatedProcessInstance = {
            ...processData,
            details: { ...processData.details, ...filesProperties },
        };

        if (filesProperties) {
            await this.removeUnusedFileIds(processTemplate.details.properties, currProcessInstance.details, updatedProcessInstance.details);
        }

        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );

        const updatedProcess = await ProcessManagerService.updateProcessInstance(processId, updatedProcessInstance).catch(async (error) => {
            await deleteFiles(Object.values(filesProperties)).catch(() => {
                // eslint-disable-next-line no-console
                console.log('failed to delete process unused files');
            });
            throw error;
        });
        await Promise.allSettled([
            this.sendProcessReviewerUpdateNotifications([updatedProcess._id], updatedProcess.steps, currProcessInstance.steps),
        ]);
        return this.getPopulatedProcess(updatedProcess, userId);
    }

    static async archiveProcess(id: string, { archived }, userId: string) {
        const updatedProcess = await ProcessManagerService.archivedProcess(id, archived);

        await Promise.allSettled([ProcessesInstancesManager.sendArchiveProcessNotification(updatedProcess, archived)]);

        return ProcessesInstancesManager.getPopulatedProcess(updatedProcess, userId);
    }

    private static async deleteAllProcessFiles({ templateId, steps, details }: IMongoProcessInstanceWithSteps) {
        const filesIdsToDelete = await this.collectFileIdsToDelete(templateId, steps, details);

        if (filesIdsToDelete.length) {
            deleteFiles(filesIdsToDelete);
        }
    }

    private static async collectFileIdsToDelete(templateId: string, steps: IMongoStepInstance[], details: InstanceProperties) {
        const fileIds: string[] = [];
        const { steps: templateSteps, details: templateDetails } = await ProcessManagerService.getProcessTemplateById(templateId);
        fileIds.push(...this.extractFileIdsFromSteps(templateSteps, steps));
        fileIds.push(...this.extractFileIdsFromProperties(templateDetails.properties, details));
        return fileIds;
    }

    private static extractFileIdsFromSteps(templateSteps: IMongoStepTemplate[], steps: IMongoStepInstance[]) {
        const fileIds: string[] = [];

        templateSteps.forEach((templateStep, stepIndex) => {
            fileIds.push(...this.extractFileIdsFromProperties(templateStep.properties, steps[stepIndex].properties));
        });

        return fileIds;
    }

    private static extractFileIdsFromProperties(templateProperties: IProcessDetails['properties'], instanceProperties: InstanceProperties = {}) {
        const fileIds: string[] = [];

        Object.entries(templateProperties.properties).forEach(([key, value]) => {
            if (value.format === PropertyFormats.FileId && instanceProperties[key]) {
                fileIds.push(instanceProperties[key]);
            }
        });
        return fileIds;
    }

    static async deleteProcessInstance(processId: string, userId: string) {
        const process = await ProcessManagerService.getProcessInstanceById(processId, userId);
        await ProcessesInstancesManager.deleteAllProcessFiles(process).catch((err) => {
            // eslint-disable-next-line no-console
            console.log(`failed to delete process files`);
            throw new ServiceError(500, `failed to delete process instance, failed when deleting files: ${err}`);
        });
        await ProcessManagerService.deleteProcessInstance(processId);

        await Promise.allSettled([ProcessesInstancesManager.sendDeleteProcessNotification(process)]);

        return process;
    }

    static async searchProcessInstances(searchBody: ISearchProcessInstancesBody, userId: string) {
        const query: ISearchProcessInstancesBody = { ...searchBody };
        if (!(await isProcessManager(userId))) query.reviewerId = userId;
        const processes = await ProcessManagerService.searchProcessInstances(query);
        return Promise.all(processes.map((process) => this.getPopulatedProcess(process, userId)));
    }

    private static async sendNewProcessNotification(processId: string) {
        const processPermissions = await getPermissions({ resourceType: 'Processes' });
        const processesManagersIds = processPermissions.map((processPermission) => processPermission.userId);

        await NotificationService.rabbitCreateNotification<INewProcessNotificationMetadata>(processesManagersIds, NotificationType.newProcess, {
            processId,
        });
    }

    static async sendProcessStatusUpdateNotification(process: IMongoProcessInstanceWithSteps, status: Status, stepId?: string) {
        const metadata: IProcessStatusUpdateNotificationMetadata = {
            processId: process._id,
            status,
        };

        if (stepId) metadata.stepId = stepId;

        await NotificationService.rabbitCreateNotification<IProcessStatusUpdateNotificationMetadata>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.processStatusUpdate,
            metadata,
        );
    }

    static async sendDeleteProcessNotification(process: IMongoProcessInstanceWithSteps) {
        await NotificationService.rabbitCreateNotification<IDeleteProcessNotificationMetadata>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.deleteProcess,
            {
                processName: process.name,
            },
        );
    }

    static async sendArchiveProcessNotification(process: IMongoProcessInstanceWithSteps, isArchived: boolean) {
        await NotificationService.rabbitCreateNotification<IArchiveProcessNotificationMetadata>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.archivedProcess,
            {
                processId: process._id,
                isArchived,
            },
        );
    }

    static async sendProcessReviewerUpdateNotifications(affectedProcessInstanceIds: string[], steps: IGenericStep[], previousSteps?: IGenericStep[]) {
        const [{ reviewersStepIds, reviewersIds }, { reviewersStepIds: previousReviewersStepIds, reviewersIds: previousReviewersId }] =
            await Promise.all([this.getReviewersStepIds(steps), this.getReviewersStepIds(previousSteps ?? [])]);

        const combinedReviewersIds = [...new Set([...reviewersIds, ...previousReviewersId])];
        const notifications: Promise<void>[] = [];

        combinedReviewersIds.forEach((reviewerId) => {
            const reviewerStepIds = reviewersStepIds[reviewerId] ?? [];
            const previousReviewerStepIds = previousReviewersStepIds[reviewerId] ?? [];

            const addedStepIdsSet = new Set<string>();
            const deletedStepIdsSet = new Set<string>();
            const unchangedStepIdsSet = new Set<string>();

            reviewerStepIds.forEach((stepId) => {
                if (previousReviewerStepIds.includes(stepId)) {
                    unchangedStepIdsSet.add(stepId);
                } else {
                    addedStepIdsSet.add(stepId);
                }
            });

            previousReviewerStepIds.forEach((stepId) => {
                if (!reviewerStepIds.includes(stepId)) {
                    deletedStepIdsSet.add(stepId);
                }
            });

            if (!addedStepIdsSet.size && !deletedStepIdsSet.size) return;

            const filteredReviewerStepIds = {
                addedStepIds: [...addedStepIdsSet],
                deletedStepIds: [...deletedStepIdsSet],
                unchangedStepIds: [...unchangedStepIdsSet],
            };

            affectedProcessInstanceIds.forEach((processId) => {
                notifications.push(
                    NotificationService.rabbitCreateNotification<IProcessReviewerUpdateNotificationMetadata>(
                        [reviewerId],
                        NotificationType.processReviewerUpdate,
                        { processId, ...filteredReviewerStepIds },
                    ),
                );
            });
        });

        await Promise.allSettled(notifications);
    }

    private static async getReviewersStepIds(steps: IGenericStep[]) {
        const reviewersStepIds: Record<string, string[]> = {};

        const reviewersIds = await this.getAllReviewersIds(steps);

        reviewersIds.forEach((reviewerId) => {
            reviewersStepIds[reviewerId] = this.getReviewerStepIds(steps, reviewerId);
        });

        return { reviewersStepIds, reviewersIds };
    }

    private static getReviewerStepIds(steps: IGenericStep[], userId: string) {
        return filteredMap(steps, (step) => ({
            include: step.reviewers.includes(userId),
            value: step._id,
        }));
    }

    private static async getAllReviewersIds(steps: IGenericStep[], withManagers?: boolean) {
        const reviewersIds = new Set<string>();

        if (withManagers) {
            const processPermissions = await getPermissions({ resourceType: 'Processes' });
            processPermissions.forEach((processPermission) => reviewersIds.add(processPermission.userId));
        }

        steps.forEach(({ reviewers }) => {
            reviewers.forEach((reviewer) => reviewersIds.add(reviewer));
        });

        return Array.from(reviewersIds);
    }
}
