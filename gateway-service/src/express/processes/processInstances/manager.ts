import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import {
    PermissionScope,
    PermissionType,
    IMongoStepTemplate,
    IProcessDetails,
    ProcessPropertyFormats,
    IMongoStepInstance,
    IGenericStepPopulated,
    IMongoProcessInstanceReviewerPopulated,
    IMongoProcessInstancePopulated,
    InstanceProperties,
    IProcessInstance,
    IProcessInstanceSearchProperties,
    Status,
    IReferencedEntityForProcess,
    IArchiveProcessNotificationMetadata,
    IDeleteProcessNotificationMetadata,
    INewProcessNotificationMetadata,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadata,
    NotificationType,
    IArchiveProcessNotificationMetadataPopulated,
    IDeleteProcessNotificationMetadataPopulated,
    INewProcessNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
    ServiceError,
    UploadedFile,
} from '@microservices/shared';
import config from '../../../config';
import InstancesService from '../../../externalServices/instanceService';
import ProcessService from '../../../externalServices/processService';
import StorageService from '../../../externalServices/storageService';
import EntityTemplateService from '../../../externalServices/templates/entityTemplateService';
import { filteredMap } from '../../../utils';
import { Authorizer } from '../../../utils/authorizer';
import DefaultManagerProxy from '../../../utils/express/manager';
import { IProcessReviewerUpdateMailNotificationMetadataPopulated } from '../../../utils/mailNotifications/interfaces';
import RabbitManager from '../../../utils/rabbit';
import InstancesManager from '../../instances/manager';
import UsersManager from '../../users/manager';
import WorkspaceManager from '../../workspaces/manager';
import { EntityNotExist, NotFoundError } from '../error';
import StepsInstancesManager from '../stepInstances/manager';

export default class ProcessesInstancesManager extends DefaultManagerProxy<ProcessService> {
    private instancesService: InstancesService;

    private entityTemplateService: EntityTemplateService;

    private storageService: StorageService;

    private instancesManager: InstancesManager;

    private stepsInstancesManager: StepsInstancesManager;

    private rabbitManager: RabbitManager;

    constructor(private workspaceId: string) {
        super(new ProcessService(workspaceId));
        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.storageService = new StorageService(workspaceId);
        this.instancesManager = new InstancesManager(workspaceId);
        this.stepsInstancesManager = new StepsInstancesManager(workspaceId);

        this.rabbitManager = new RabbitManager(workspaceId);
    }

    async getPropertiesWithEntities(properties: InstanceProperties, template: IProcessDetails['properties'], userId: string) {
        const updatedProperties: InstanceProperties = { ...properties };

        const entityProperties = Object.entries(template.properties || {}).filter(
            ([key, value]) => value.format === ProcessPropertyFormats.EntityReference && properties[key] !== undefined,
        );

        if (entityProperties.length === 0) return properties;

        const userPermissions = await new Authorizer(this.workspaceId).getWorkspacePermissions(userId);

        const promises = entityProperties.map(async ([key]) => {
            const entity = await this.instancesService.getEntityInstanceById(properties[key]).catch((error) => {
                if (axios.isAxiosError(error) && error.response?.status === StatusCodes.NOT_FOUND) return properties[key];
                throw error;
            });

            if (typeof entity === 'string') return;

            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity.templateId);

            updatedProperties[key] = {
                entity,
                userHavePermission: Boolean(
                    userPermissions.admin?.scope ||
                        Object.keys(userPermissions.instances?.categories ?? {}).find((categoryId) => categoryId === entityTemplate.category._id),
                ),
                entityTemplate,
            } as IReferencedEntityForProcess;
        });

        await Promise.all(promises);

        return updatedProperties;
    }

    private async getPopulatedProcess(process: IMongoProcessInstancePopulated, userId: string): Promise<IMongoProcessInstanceReviewerPopulated> {
        const processTemplate = await this.service.getProcessTemplateById(process.templateId);
        const details = await this.getPropertiesWithEntities(process.details, processTemplate.details.properties, userId);

        const result = await Promise.all(
            process.steps.map((step) => this.stepsInstancesManager.getStepInstanceWithEntitiesAndReviewers(step, userId)),
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

    async getProcessInstance(id: string, userId: string) {
        const process = await this.service.getProcessInstanceById(id, userId);
        return this.getPopulatedProcess(process, userId);
    }

    async getProcessInstanceOrNull(id: string, userId: string) {
        try {
            const process = await this.service.getProcessInstanceById(id, userId);
            return this.getPopulatedProcess(process, userId);
        } catch (error: any) {
            if (error instanceof NotFoundError && error.code === StatusCodes.NOT_FOUND) return null;
            throw error;
        }
    }

    async checkEntityReferenceFields(properties: InstanceProperties, schema: IProcessDetails['properties']) {
        await Promise.all(
            Object.entries(schema.properties).map(async ([key, value]) => {
                if (value.format === ProcessPropertyFormats.EntityReference && properties[key] !== undefined) {
                    try {
                        await this.instancesService.getEntityInstanceById(properties[key]);
                    } catch {
                        throw new EntityNotExist(properties[key]);
                    }
                }
            }),
        );
    }

    async createProcessInstance(processData: IProcessInstance, files: UploadedFile[], userId: string) {
        const processTemplate = await this.service.getProcessTemplateById(processData.templateId);
        this.checkEntityReferenceFields(processData.details, processTemplate.details.properties);
        if (!files.length) {
            const process = await this.service.createProcessInstance(processData, userId);
            const populatedProcess = await this.getPopulatedProcess(process, userId);

            await Promise.allSettled([
                this.sendNewProcessNotification(populatedProcess),
                this.sendProcessReviewerUpdateNotification([process._id], populatedProcess.steps),
            ]);
            return populatedProcess;
        }
        const { props: processDetails, files: filesToUpload } = await this.instancesManager.uploadInstanceFiles(files, processData.details);

        const process = await this.service.createProcessInstance({ ...processData, details: processDetails }, userId).catch(async (error) => {
            await this.storageService.deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch(() => {
                throw new ServiceError(undefined, `failed to delete process unused files`, {
                    error,
                });
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

    async removeUnusedFileIds(
        templateProperties: IProcessDetails['properties'],
        oldProperties: Record<string, any>,
        newProperties: Record<string, any>,
    ) {
        const oldFileIds = new Set<string>(this.extractFileIdsFromProperties(templateProperties, oldProperties));
        const newFileIds = new Set<string>(this.extractFileIdsFromProperties(templateProperties, newProperties));

        const idsToDelete = Array.from(oldFileIds).filter((id) => !newFileIds.has(id));
        if (idsToDelete.length)
            await this.storageService.deleteFiles(idsToDelete).catch((error) => {
                throw new ServiceError(undefined, `failed to delete unused files: ${idsToDelete}`, { error });
            });
    }

    async updateProcessInstance(processId: string, processData: IProcessInstance, files: UploadedFile[], userId: string) {
        const currProcessInstance = await this.getProcessInstance(processId, userId);
        const processTemplate = await this.service.getProcessTemplateById(currProcessInstance.templateId);

        if (processData.details) this.checkEntityReferenceFields(processData.details, processTemplate.details.properties);

        const { props, files: filesToUpload } = await this.instancesManager.uploadInstanceFiles(files, processData.details);

        const updatedProcessInstance = !files.length
            ? processData
            : {
                  ...processData,
                  details: props,
              };

        if (props) {
            await this.removeUnusedFileIds(processTemplate.details.properties, currProcessInstance.details, updatedProcessInstance.details);
        }

        const updatedProcess = await this.service.updateProcessInstance(processId, updatedProcessInstance, userId).catch(async (error) => {
            await this.storageService.deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch(() => {
                throw new ServiceError(undefined, `failed to delete process unused files`, { error });
            });
            throw error;
        });
        const updatedPopulatedProcess = await this.getPopulatedProcess(updatedProcess, userId);

        await Promise.allSettled([
            this.sendProcessReviewerUpdateNotification([updatedProcess._id], updatedPopulatedProcess.steps, currProcessInstance.steps),
        ]);
        return updatedPopulatedProcess;
    }

    async archiveProcess(id: string, { archived }, userId: string) {
        const updatedProcess = await this.service.archivedProcess(id, archived);
        const updatedPopulatedProcess = await this.getPopulatedProcess(updatedProcess, userId);

        await Promise.allSettled([this.sendArchiveProcessNotification(updatedPopulatedProcess, archived)]);

        return updatedPopulatedProcess;
    }

    private async deleteAllProcessFiles({ templateId, steps, details }: IMongoProcessInstancePopulated) {
        const filesIdsToDelete = await this.collectFileIdsToDelete(templateId, steps, details);

        if (filesIdsToDelete.length) {
            await this.storageService.deleteFiles(filesIdsToDelete);
        }
    }

    private async collectFileIdsToDelete(templateId: string, steps: IMongoStepInstance[], details: InstanceProperties) {
        const fileIds: string[] = [];
        const { steps: templateSteps, details: templateDetails } = await this.service.getProcessTemplateById(templateId);
        fileIds.push(...this.extractFileIdsFromSteps(templateSteps, steps));
        fileIds.push(...this.extractFileIdsFromProperties(templateDetails.properties, details));
        return fileIds;
    }

    private extractFileIdsFromSteps(templateSteps: IMongoStepTemplate[], steps: IMongoStepInstance[]) {
        const fileIds: string[] = [];

        templateSteps.forEach((templateStep, stepIndex) => {
            fileIds.push(...this.extractFileIdsFromProperties(templateStep.properties, steps[stepIndex].properties));
        });

        return fileIds;
    }

    private extractFileIdsFromProperties(templateProperties: IProcessDetails['properties'], instanceProperties: InstanceProperties = {}) {
        const fileIds: string[] = [];

        Object.entries(templateProperties.properties || {}).forEach(([key, value]) => {
            if ((value.format === ProcessPropertyFormats.FileId || value.format === ProcessPropertyFormats.Signature) && instanceProperties[key]) {
                fileIds.push(instanceProperties[key]);
            } else if (value.items?.format === ProcessPropertyFormats.FileId && instanceProperties[key]) {
                fileIds.push(...instanceProperties[key]);
            }
        });
        return fileIds;
    }

    async deleteProcessInstance(processId: string, userId: string) {
        const process = await this.service.getProcessInstanceById(processId, userId);
        const populatedProcess = await this.getPopulatedProcess(process, userId);

        await this.deleteAllProcessFiles(process).catch((error) => {
            throw new ServiceError(undefined, `failed to delete process files`, { error });
        });
        await this.service.deleteProcessInstance(processId);

        await Promise.allSettled([this.sendDeleteProcessNotification(populatedProcess)]);

        return populatedProcess;
    }

    async searchProcessInstances(searchBody: IProcessInstanceSearchProperties, userId: string) {
        const query: IProcessInstanceSearchProperties = { ...searchBody };

        const userPermissions = await new Authorizer(this.workspaceId).getWorkspacePermissions(userId);

        if (!userPermissions.admin?.scope && userPermissions.processes?.scope !== PermissionScope.write) query.reviewerId = userId;

        query.userId = userId;
        const processes = await this.service.searchProcessInstances(query);
        return Promise.all(processes.map((process) => this.getPopulatedProcess(process, userId)));
    }

    private async sendNewProcessNotification(process: IMongoProcessInstanceReviewerPopulated) {
        const workspaceIds = await WorkspaceManager.getWorkspaceHierarchyIds(this.workspaceId);

        const processesManagersIds = await UsersManager.searchUserIds({
            workspaceIds,
            permissions: {
                [PermissionType.processes]: {
                    scope: PermissionScope.write,
                },
            },
            limit: config.instanceService.searchEntitiesFlowMaxLimit,
        });

        await this.rabbitManager.createNotification<INewProcessNotificationMetadata, INewProcessNotificationMetadataPopulated>(
            processesManagersIds,
            NotificationType.newProcess,
            {
                processId: process._id,
            },
            { process },
        );
    }

    async sendProcessStatusUpdateNotification(process: IMongoProcessInstanceReviewerPopulated, status: Status, stepId?: string) {
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

        await this.rabbitManager.createNotification<IProcessStatusUpdateNotificationMetadata, IProcessStatusUpdateNotificationMetadataPopulated>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.processStatusUpdate,
            metadata,
            metadataPopulated,
        );
    }

    async sendDeleteProcessNotification(process: IMongoProcessInstanceReviewerPopulated) {
        await this.rabbitManager.createNotification<IDeleteProcessNotificationMetadata, IDeleteProcessNotificationMetadataPopulated>(
            await this.getAllReviewersIds(process.steps, true),
            NotificationType.deleteProcess,
            {
                processName: process.name,
            },
            { processName: process.name },
        );
    }

    async sendArchiveProcessNotification(process: IMongoProcessInstanceReviewerPopulated, isArchived: boolean) {
        await this.rabbitManager.createNotification<IArchiveProcessNotificationMetadata, IArchiveProcessNotificationMetadataPopulated>(
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

    async sendProcessReviewerUpdateNotification(
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
                    const step = await this.service.getStepTemplateByStepInstanceId(stepId);
                    return step;
                }),
            );

            const deletedSteps: IMongoStepTemplate[] = await Promise.all(
                filteredReviewerStepIds.deletedStepIds.map(async (stepId) => {
                    const step = await this.service.getStepTemplateByStepInstanceId(stepId);
                    return step;
                }),
            );
            affectedProcessInstanceIds.forEach(async (processId) => {
                const process = await this.service.getProcessInstanceById(processId);
                notifications.push(
                    this.rabbitManager.createNotification<
                        IProcessReviewerUpdateNotificationMetadata,
                        IProcessReviewerUpdateMailNotificationMetadataPopulated
                    >(
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

    private async getReviewersStepIds(steps: IGenericStepPopulated[]) {
        const reviewersStepIds: Record<string, string[]> = {};

        const reviewersIds = await this.getAllReviewersIds(steps);

        reviewersIds.forEach((reviewerId) => {
            reviewersStepIds[reviewerId] = this.getReviewerStepIds(steps, reviewerId);
        });

        return { reviewersStepIds, reviewersIds };
    }

    private getReviewerStepIds(steps: IGenericStepPopulated[], userId: string) {
        return filteredMap(steps, (step) => ({
            include: step.reviewers.some(({ _id }) => _id === userId),
            value: step._id,
        }));
    }

    private async getAllReviewersIds(steps: IGenericStepPopulated[], withManagers?: boolean) {
        const workspaceIds = await WorkspaceManager.getWorkspaceHierarchyIds(this.workspaceId);
        const reviewersIds = new Set<string>();

        if (withManagers) {
            const userIdsWithPermission = await UsersManager.searchUserIds({
                workspaceIds,
                permissions: {
                    [PermissionType.processes]: {
                        scope: PermissionScope.write,
                    },
                },
                limit: config.instanceService.searchEntitiesFlowMaxLimit,
            });

            userIdsWithPermission.forEach((userId) => reviewersIds.add(userId));
        }

        steps.forEach(({ reviewers }) => {
            reviewers.forEach(({ _id }) => reviewersIds.add(_id));
        });

        return Array.from(reviewersIds);
    }
}
