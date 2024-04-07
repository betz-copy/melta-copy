import axios from 'axios';
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
import {
    IArchiveProcessNotificationMetadata,
    IDeleteProcessNotificationMetadata,
    INewProcessNotificationMetadata,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadata,
    NotificationType,
} from '../../../externalServices/notificationService/interfaces';
import { getPermissions, isProcessManager } from '../../../externalServices/permissionsService';
import { filteredMap } from '../../../utils';
import { IGenericStepPopulated } from '../../../externalServices/processService/interfaces';
import { IMongoStepInstance } from '../../../externalServices/processService/interfaces/stepInstance';
import { InstanceManagerService } from '../../../externalServices/instanceService';
import { EntityNotExist, NotFoundError } from '../error';
import { EntityTemplateManagerService } from '../../../externalServices/entityTemplateService';
import PermissionsManager from '../../permissions/manager';
import StepsInstancesManager from '../stepInstances/manager';
import { IMongoStepTemplate } from '../../../externalServices/processService/interfaces/stepTemplate';
import { rabbitCreateNotification } from '../../../utils/createNotification';
import {
    IArchiveProcessNotificationMetadataPopulated,
    IDeleteProcessNotificationMetadataPopulated,
    INewProcessNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
} from '../../../externalServices/notificationService/interfaces/populated';
import { IProcessReviewerUpdateMailNotificationMetadataPopulated } from '../../../utils/mailNotifications/interfaces';
import logger from '../../../utils/logger/logsLogger';

export default class ProcessesInstancesManager {
    static async getPropertiesWithEntities(properties: InstanceProperties, template: IProcessDetails['properties'], userId: string) {
        const updatedProperties: InstanceProperties = { ...properties };

        const entityProperties = Object.entries(template.properties).filter(
            ([key, value]) => value.format === PropertyFormats.EntityReference && properties[key] !== undefined,
        );

        if (entityProperties.length === 0) return properties;

        const userPermissionPromise = PermissionsManager.getPermissionsOfUserId(userId);

        const promises = entityProperties.map(async ([key]) => {
            const entity = await InstanceManagerService.getEntityInstanceById(properties[key]).catch((error) => {
                if (axios.isAxiosError(error) && error.response?.status === 404) return properties[key];
                throw error;
            });

            if (typeof entity === 'string') return;

            const entityTemplatePromise = EntityTemplateManagerService.getEntityTemplateById(entity.templateId);
            const [entityTemplate, userPermission] = await Promise.all([entityTemplatePromise, userPermissionPromise]);

            updatedProperties[key] = {
                entity,
                userHavePermission: Boolean(
                    userPermission.instancesPermissions.find((instance) => instance.category === entityTemplate!.category._id),
                ),
                entityTemplate,
            } as IReferencedEntityForProcess;
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
            const populatedProcess = await this.getPopulatedProcess(process, userId);

            await Promise.allSettled([
                this.sendNewProcessNotification(populatedProcess),
                this.sendProcessReviewerUpdateNotification([process._id], populatedProcess.steps),
            ]);
            return populatedProcess;
        }
        const { props: processDetails, files: filesToUpload } = await InstancesManager.uploadInstanceFiles(files, processData.details);
        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );

        const process = await ProcessManagerService.createProcessInstance({ ...processData, details: processDetails }).catch(async (error) => {
            await deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch(() => {
                logger.error('failed to delete process unused files');
            });
            throw error;
        });
        const populatedProcess = await this.getPopulatedProcess(process, userId);

        await Promise.allSettled([
            this.sendNewProcessNotification(populatedProcess),
            this.sendProcessReviewerUpdateNotification([process._id], populatedProcess.steps),
        ]);
        return populatedProcess;
    }

    static async removeUnusedFileIds(
        templateProperties: IProcessDetails['properties'],
        oldProperties: Record<string, any>,
        newProperties: Record<string, any>,
    ) {
        const oldFileIds = new Set<string>(this.extractFileIdsFromProperties(templateProperties, oldProperties));
        const newFileIds = new Set<string>(this.extractFileIdsFromProperties(templateProperties, newProperties));

        const idsToDelete = Array.from(oldFileIds).filter((id) => !newFileIds.has(id));
        if (idsToDelete.length) await deleteFiles(idsToDelete).catch(() => logger.error(`failed to delete unused files: ${idsToDelete}`));
    }

    static async updateProcessInstance(processId: string, processData: IProcessInstance, files: Express.Multer.File[], userId: string) {
        const currProcessInstance = await this.getProcessInstance(processId, userId);
        const processTemplate = await ProcessManagerService.getProcessTemplateById(currProcessInstance.templateId);

        if (processData.details) this.checkEntityReferenceFields(processData.details, processTemplate.details.properties);
        if (!files.length) {
            const updatedProcess = await ProcessManagerService.updateProcessInstance(processId, processData);
            const updatedPopulatedProcess = await this.getPopulatedProcess(updatedProcess, userId);

            await Promise.allSettled([
                this.sendProcessReviewerUpdateNotification([updatedProcess._id], updatedPopulatedProcess.steps, currProcessInstance.steps),
            ]);
            return updatedPopulatedProcess;
        }

        const { props, files: filesToUpload } = await InstancesManager.uploadInstanceFiles(files, processData.details);

        const updatedProcessInstance = {
            ...processData,
            details: props,
        };

        if (props) {
            await this.removeUnusedFileIds(processTemplate.details.properties, currProcessInstance.details, updatedProcessInstance.details);
        }

        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );

        const updatedProcess = await ProcessManagerService.updateProcessInstance(processId, updatedProcessInstance).catch(async (error) => {
            await deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch(() => {
                logger.error('failed to delete process unused files');
            });
            throw error;
        });
        const updatedPopulatedProcess = await this.getPopulatedProcess(updatedProcess, userId);

        await Promise.allSettled([
            this.sendProcessReviewerUpdateNotification([updatedProcess._id], updatedPopulatedProcess.steps, currProcessInstance.steps),
        ]);
        return updatedPopulatedProcess;
    }

    static async archiveProcess(id: string, { archived }, userId: string) {
        const updatedProcess = await ProcessManagerService.archivedProcess(id, archived);
        const updatedPopulatedProcess = await ProcessesInstancesManager.getPopulatedProcess(updatedProcess, userId);

        await Promise.allSettled([ProcessesInstancesManager.sendArchiveProcessNotification(updatedPopulatedProcess, archived)]);

        return updatedPopulatedProcess;
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
            } else if (value.items?.format === PropertyFormats.FileId && instanceProperties[key]) {
                fileIds.push(...instanceProperties[key]);
            }
        });
        return fileIds;
    }

    static async deleteProcessInstance(processId: string, userId: string) {
        const process = await ProcessManagerService.getProcessInstanceById(processId, userId);
        const populatedProcess = await this.getPopulatedProcess(process, userId);

        await ProcessesInstancesManager.deleteAllProcessFiles(process).catch((err) => {
            logger.error(`failed to delete process files`);
            throw new ServiceError(500, `failed to delete process instance, failed when deleting files: ${err}`);
        });
        await ProcessManagerService.deleteProcessInstance(processId);

        await Promise.allSettled([ProcessesInstancesManager.sendDeleteProcessNotification(populatedProcess)]);

        return populatedProcess;
    }

    static async searchProcessInstances(searchBody: ISearchProcessInstancesBody, userId: string) {
        const query: ISearchProcessInstancesBody = { ...searchBody };

        if (!(await isProcessManager(userId))) query.reviewerId = userId;
        const processes = await ProcessManagerService.searchProcessInstances(query);
        return Promise.all(processes.map((process) => this.getPopulatedProcess(process, userId)));
    }

    private static async sendNewProcessNotification(process: IMongoProcessInstancePopulated) {
        const processPermissions = await getPermissions({ resourceType: 'Processes' });
        const processesManagersIds = processPermissions.map((processPermission) => processPermission.userId);
        await rabbitCreateNotification<INewProcessNotificationMetadata, INewProcessNotificationMetadataPopulated>(
            processesManagersIds,
            NotificationType.newProcess,
            {
                processId: process._id,
            },
            { process },
        );
    }

    static async sendProcessStatusUpdateNotification(process: IMongoProcessInstancePopulated, status: Status, stepId?: string) {
        const metadata: IProcessStatusUpdateNotificationMetadata = {
            processId: process._id,
            status,
        };
        const metadataPopulated: IProcessStatusUpdateNotificationMetadataPopulated = {
            process,
            status,
        };

        if (stepId) {
            metadata.stepId = stepId;
            metadataPopulated.step = process.steps.find(({ _id }) => _id === stepId)!;
        }

        await rabbitCreateNotification<IProcessStatusUpdateNotificationMetadata, IProcessStatusUpdateNotificationMetadataPopulated>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.processStatusUpdate,
            metadata,
            metadataPopulated,
        );
    }

    static async sendDeleteProcessNotification(process: IMongoProcessInstancePopulated) {
        await rabbitCreateNotification<IDeleteProcessNotificationMetadata, IDeleteProcessNotificationMetadataPopulated>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.deleteProcess,
            {
                processName: process.name,
            },
            { processName: process.name },
        );
    }

    static async sendArchiveProcessNotification(process: IMongoProcessInstancePopulated, isArchived: boolean) {
        await rabbitCreateNotification<IArchiveProcessNotificationMetadata, IArchiveProcessNotificationMetadataPopulated>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.archivedProcess,
            {
                processId: process._id,
                isArchived,
            },
            {
                process,
                isArchived,
            },
        );
    }

    static async sendProcessReviewerUpdateNotification(
        affectedProcessInstanceIds: string[],
        steps: IGenericStepPopulated[],
        previousSteps?: IGenericStepPopulated[],
    ) {
        const [{ reviewersStepIds, reviewersIds }, { reviewersStepIds: previousReviewersStepIds, reviewersIds: previousReviewersId }] =
            await Promise.all([this.getReviewersStepIds(steps), this.getReviewersStepIds(previousSteps ?? [])]);

        const combinedReviewersIds = [...new Set([...reviewersIds, ...previousReviewersId])];
        const notifications: Promise<void>[] = [];

        combinedReviewersIds.forEach(async (reviewerId) => {
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
            const addedSteps: IMongoStepTemplate[] = await Promise.all(
                filteredReviewerStepIds.addedStepIds.map(async (stepId) => {
                    const step = await ProcessManagerService.getStepTemplateByStepInstanceId(stepId);
                    return step;
                }),
            );

            const deletedSteps: IMongoStepTemplate[] = await Promise.all(
                filteredReviewerStepIds.deletedStepIds.map(async (stepId) => {
                    const step = await ProcessManagerService.getStepTemplateByStepInstanceId(stepId);
                    return step;
                }),
            );
            affectedProcessInstanceIds.forEach(async (processId) => {
                const process = await ProcessManagerService.getProcessInstanceById(processId);
                notifications.push(
                    rabbitCreateNotification<IProcessReviewerUpdateNotificationMetadata, IProcessReviewerUpdateMailNotificationMetadataPopulated>(
                        [reviewerId],
                        NotificationType.processReviewerUpdate,
                        {
                            processId,
                            ...filteredReviewerStepIds,
                        },
                        {
                            process,
                            addedSteps,
                            deletedSteps,
                            unchangedStepIds: filteredReviewerStepIds.unchangedStepIds,
                        },
                    ),
                );
            });
        });

        await Promise.allSettled(notifications);
    }

    private static async getReviewersStepIds(steps: IGenericStepPopulated[]) {
        const reviewersStepIds: Record<string, string[]> = {};

        const reviewersIds = await this.getAllReviewersIds(steps);

        reviewersIds.forEach((reviewerId) => {
            reviewersStepIds[reviewerId] = this.getReviewerStepIds(steps, reviewerId);
        });

        return { reviewersStepIds, reviewersIds };
    }

    private static getReviewerStepIds(steps: IGenericStepPopulated[], userId: string) {
        return filteredMap(steps, (step) => ({
            include: step.reviewers.some(({ id }) => id === userId),
            value: step._id,
        }));
    }

    private static async getAllReviewersIds(steps: IGenericStepPopulated[], withManagers?: boolean) {
        const reviewersIds = new Set<string>();

        if (withManagers) {
            const processPermissions = await getPermissions({ resourceType: 'Processes' });
            processPermissions.forEach((processPermission) => reviewersIds.add(processPermission.userId));
        }

        steps.forEach(({ reviewers }) => {
            reviewers.forEach(({ id }) => reviewersIds.add(id));
        });

        return Array.from(reviewersIds);
    }
}
