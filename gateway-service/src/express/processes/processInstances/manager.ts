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
import StepsInstancesManager from '../stepInstances/manager';
import { ServiceError } from '../../error';
import UsersManager from '../../users/manager';
import { NotificationService } from '../../../externalServices/notificationService';
import {
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
import { EntityNotExist } from '../error';
import { EntityTemplateManagerService } from '../../../externalServices/entityTemplateManager';
import PermissionsManager from '../../permissions/manager';

export default class ProcessesInstancesManager {
    static getObjectFilesProperties(filesProperties: Record<string, string>) {
        const objectFileProperties: { details: IProcessInstance['details']; summaryDetails: IProcessInstance['summaryDetails'] } = {
            details: {},
            summaryDetails: {},
        };
        Object.entries(filesProperties).forEach(([key, value]) => {
            const [prefix, field] = key.split('.');
            objectFileProperties[prefix][field] = value;
        });

        return objectFileProperties;
    }

    public static async getPropertiesWithEntities(properties: InstanceProperties, template: IProcessDetails['properties'], userId: string) {
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

    private static async getProcessInstanceWithReviewersAndEntities(
        process: IMongoProcessInstanceWithSteps,
        userId: string,
    ): Promise<IMongoProcessInstancePopulated> {
        const processTemplate = await ProcessManagerService.getProcessTemplateById(process.templateId);
        const populatedSteps = await Promise.all(
            process.steps.map((step) => StepsInstancesManager.getStepInstanceWithEntitesAndReviewers(step, userId)),
        );

        const reviewer = process.reviewerId ? await UsersManager.getUserById(process.reviewerId) : undefined;
        const details = await this.getPropertiesWithEntities(process.details, processTemplate.details.properties, userId);
        const summaryDetails = process.summaryDetails
            ? await this.getPropertiesWithEntities(process.summaryDetails, processTemplate.summaryDetails.properties, userId)
            : undefined;
        const { reviewerId, ...populatedProcess } = {
            ...process,
            steps: populatedSteps,
            details,
            summaryDetails,
            reviewer,
        };

        return populatedProcess;
    }

    static async getProcessInstance(id: string, userId: string) {
        const process = await ProcessManagerService.getProcessInstanceById(id, userId);
        return this.getProcessInstanceWithReviewersAndEntities(process, userId);
    }

    private static async handleNotificationsOnCreateProcessInstance(process: IMongoProcessInstanceWithSteps) {
        const processTemplate = await ProcessManagerService.getProcessTemplateById(process.templateId);

        await Promise.allSettled([
            this.sendNewProcessNotification(process._id),
            this.sendProcessReviewerUpdateNotifications([process._id], process.steps),
            this.sendProcessReviewerUpdateNotifications([process._id], processTemplate.steps),
        ]);
    }

    public static async checkEntityReferenceFields(properties: InstanceProperties, schema: IProcessDetails['properties'], _userId: string) {
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

        this.checkEntityReferenceFields(processData.details, processTemplate.details.properties, userId);
        if (!files.length) {
            const process = await ProcessManagerService.createProcessInstance(processData);

            this.handleNotificationsOnCreateProcessInstance(process);
            return this.getProcessInstanceWithReviewersAndEntities(process, userId);
        }
        const filesProperties = await InstancesManager.uploadInstanceFiles(files);
        const { details: detailsFileProperties } = this.getObjectFilesProperties(filesProperties);
        const processDetails = { ...processData.details, ...detailsFileProperties };

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

        this.handleNotificationsOnCreateProcessInstance(process);
        return this.getProcessInstanceWithReviewersAndEntities(process, userId);
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

    private static async handleNotificationsOnUpdateProcessInstance(
        process: IMongoProcessInstanceWithSteps,
        previousProcess: IMongoProcessInstanceWithSteps,
    ) {
        await Promise.allSettled([
            this.sendProcessReviewerUpdateNotifications([process._id], process.steps, previousProcess.steps),
            previousProcess.status !== process.status ? this.sendProcessStatusUpdateNotification(process, process.status) : undefined,
        ]);
    }

    static async updateProcessInstance(processId: string, processData: IProcessInstance, files: Express.Multer.File[], userId: string) {
        const currProcessInstance = await ProcessManagerService.getProcessInstanceById(processId);
        const processTemplate = await ProcessManagerService.getProcessTemplateById(currProcessInstance.templateId);

        if (processData.details) this.checkEntityReferenceFields(processData.details, processTemplate.details.properties, userId);
        if (processData.summaryDetails)
            this.checkEntityReferenceFields(processData.summaryDetails, processTemplate.summaryDetails.properties, userId);
        if (!files.length) {
            const process = await ProcessManagerService.updateProcessInstance(
                processId,
                processData.status ? { ...processData, reviewerId: userId } : processData,
            );

            this.handleNotificationsOnUpdateProcessInstance(process, currProcessInstance);
            return this.getProcessInstanceWithReviewersAndEntities(process, userId);
        }

        const filesProperties = await InstancesManager.uploadInstanceFiles(files);
        const { details: detailsFileProperties, summaryDetails: summaryFileProperties } = this.getObjectFilesProperties(filesProperties);

        const updatedProcessInstance = {
            ...processData,
            details: { ...processData.details, ...detailsFileProperties },
            summaryDetails: { ...processData.summaryDetails, ...summaryFileProperties },
        };

        if (detailsFileProperties) {
            await this.removeUnusedFileIds(processTemplate.details.properties, currProcessInstance.details, updatedProcessInstance.details);
        }
        if (summaryFileProperties && currProcessInstance.summaryDetails) {
            await this.removeUnusedFileIds(
                processTemplate.summaryDetails.properties,
                currProcessInstance.summaryDetails,
                updatedProcessInstance.summaryDetails,
            );
        }

        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );

        if (updatedProcessInstance.status) {
            updatedProcessInstance.reviewerId = userId;
        }

        const process = await ProcessManagerService.updateProcessInstance(processId, updatedProcessInstance).catch(async (error) => {
            await deleteFiles(Object.values(filesProperties)).catch(() => {
                // eslint-disable-next-line no-console
                console.log('failed to delete process unused files');
            });
            throw error;
        });

        this.handleNotificationsOnUpdateProcessInstance(process, currProcessInstance);
        return this.getProcessInstanceWithReviewersAndEntities(process, userId);
    }

    private static async deleteAllProcessFiles({ templateId, steps, details, summaryDetails }: IMongoProcessInstanceWithSteps) {
        const filesIdsToDelete = await this.collectFileIdsToDelete(templateId, steps, details, summaryDetails);

        if (filesIdsToDelete.length) {
            deleteFiles(filesIdsToDelete);
        }
    }

    private static async collectFileIdsToDelete(
        templateId: string,
        steps: IMongoStepInstance[],
        details: InstanceProperties,
        summaryDetails?: InstanceProperties,
    ) {
        const fileIds: string[] = [];
        const {
            steps: templateSteps,
            details: templateDetails,
            summaryDetails: templateSummaryDetails,
        } = await ProcessManagerService.getProcessTemplateById(templateId);

        fileIds.push(...this.extractFileIdsFromSteps(templateSteps, steps));
        fileIds.push(...this.extractFileIdsFromProperties(templateDetails.properties, details.properties));

        if (summaryDetails) {
            fileIds.push(...this.extractFileIdsFromProperties(templateSummaryDetails.properties, summaryDetails.properties));
        }

        return fileIds;
    }

    private static extractFileIdsFromSteps(templateSteps, steps) {
        const fileIds: string[] = [];

        templateSteps.forEach((templateStep, stepIndex) => {
            fileIds.push(...this.extractFileIdsFromProperties(templateStep.properties, steps[stepIndex].properties));
        });

        return fileIds;
    }

    private static extractFileIdsFromProperties(templateProperties: IProcessDetails['properties'], instanceProperties: InstanceProperties) {
        const fileIds: string[] = [];

        Object.entries(templateProperties.properties).forEach(([key, value]) => {
            if (value.format === PropertyFormats.FileId) fileIds.push(instanceProperties[key]);
        });

        return fileIds;
    }

    static async deleteProcessInstance(processId: string, userId: string) {
        const processData = await ProcessManagerService.getProcessInstanceById(processId);
        await ProcessesInstancesManager.deleteAllProcessFiles(processData).catch((err) => {
            // eslint-disable-next-line no-console
            console.log(`failed to delete process files`);
            throw new ServiceError(500, `failed to delete process instance, failed when deleting files: ${err}`);
        });
        const process = await ProcessManagerService.deleteProcessInstance(processId);
        return this.getProcessInstanceWithReviewersAndEntities(process, userId);
    }

    static async searchProcessInstances(searchBody: ISearchProcessInstancesBody, userId: string) {
        const query: ISearchProcessInstancesBody = { ...searchBody };

        if (!(await isProcessManager(userId))) query.reviewerId = userId;

        const processes = await ProcessManagerService.searchProcessInstances(query);
        return Promise.all(processes.map((process) => this.getProcessInstanceWithReviewersAndEntities(process, userId)));
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

    static async sendProcessReviewerUpdateNotifications(
        affectedProcessInstanceIds: string[], // affected process instances by reviewers update of process/processTemplate
        steps: IGenericStep[],
        previousSteps?: IGenericStep[],
    ) {
        const [{ reviewersStepIds, reviewersIds }, { reviewersStepIds: previousReviewersStepIds, reviewersIds: previousReviewersId }] =
            await Promise.all([this.getReviewersStepIds(steps), this.getReviewersStepIds(previousSteps ?? [])]);

        const combinedReviewersIds = [...reviewersIds, ...previousReviewersId];
        const notifications: Promise<void>[] = [];

        combinedReviewersIds.forEach((reviewerId) => {
            const reviewerStepIds = reviewersStepIds[reviewerId] ?? [];
            const previousReviewerStepIds = previousReviewersStepIds[reviewerId] ?? [];

            const filteredReviewerStepIds: Omit<IProcessReviewerUpdateNotificationMetadata, 'processId'> = {
                addedStepIds: [],
                deletedStepIds: [],
                unchangedStepIds: [],
            };

            reviewerStepIds.forEach((stepId) => {
                if (previousReviewerStepIds.includes(stepId)) {
                    filteredReviewerStepIds.unchangedStepIds.push(stepId);
                } else {
                    filteredReviewerStepIds.addedStepIds.push(stepId);
                }
            });

            previousReviewerStepIds.forEach((stepId) => {
                if (!reviewerStepIds.includes(stepId)) {
                    filteredReviewerStepIds.deletedStepIds.push(stepId);
                }
            });

            if (!filteredReviewerStepIds.addedStepIds.length && !filteredReviewerStepIds.deletedStepIds.length) return;

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
