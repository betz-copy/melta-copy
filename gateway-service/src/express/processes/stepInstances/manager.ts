import { UploadedFile } from '@packages/entity';
import {
    IMongoProcessInstancePopulated,
    IMongoProcessInstanceReviewerPopulated,
    IMongoStepInstance,
    IMongoStepInstancePopulated,
    IStepInstance,
    UpdateStepReqBody,
} from '@packages/process';
import { IReqUser } from '@packages/user';
import { logger } from '@packages/utils';
import ProcessService from '../../../externalServices/processService';
import StorageService from '../../../externalServices/storageService';
import DefaultManagerProxy from '../../../utils/express/manager';
import InstancesManager from '../../instances/manager';
import UsersManager from '../../users/manager';
import ProcessesInstancesManager from '../processInstances/manager';

class StepsInstancesManager extends DefaultManagerProxy<ProcessService> {
    private storageService: StorageService;

    private instancesManager: InstancesManager;

    constructor(private workspaceId: string) {
        super(new ProcessService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.instancesManager = new InstancesManager(workspaceId);
    }

    private async handleNotificationsOnUpdateStepInstance(
        process: IMongoProcessInstanceReviewerPopulated,
        previousProcess: IMongoProcessInstancePopulated,
        updatedStep: IMongoStepInstance,
    ) {
        const processInstancesManager = new ProcessesInstancesManager(this.workspaceId);

        await Promise.allSettled([
            processInstancesManager.sendProcessStatusUpdateNotification(process, updatedStep.status, updatedStep._id),
            process.status !== previousProcess.status
                ? processInstancesManager.sendProcessStatusUpdateNotification(process, process.status)
                : undefined,
        ]);
    }

    async getStepInstanceWithEntitiesAndReviewers(step: IMongoStepInstance, user: IReqUser): Promise<IMongoStepInstancePopulated> {
        const processInstancesManager = new ProcessesInstancesManager(this.workspaceId);
        const stepTemplate = await this.service.getStepTemplateByStepInstanceId(step._id);

        const reviewerPromise = step.reviewerId ? UsersManager.getUserById(step.reviewerId) : Promise.resolve(undefined);
        const populatedReviewersPromise = Promise.all(step.reviewers.map((id) => UsersManager.getUserById(id)));

        const propertiesPromise =
            step.properties && processInstancesManager.getPropertiesWithEntities(step.properties, stepTemplate.properties, user);

        return Promise.all([reviewerPromise, populatedReviewersPromise, propertiesPromise]).then(([reviewer, populatedReviewers, properties]) => {
            const { reviewerId: _reviewerId, ...populatedStep } = {
                ...step,
                reviewers: populatedReviewers,
                reviewer,
                ...(properties !== undefined && { properties }),
            };
            return populatedStep;
        });
    }

    async updateStep(
        processId: string,
        stepId: string,
        updatedData: Partial<Pick<IStepInstance, 'properties' | 'status' | 'comments'>>,
        files: UploadedFile[],
        user: IReqUser,
    ) {
        const processInstancesManager = new ProcessesInstancesManager(this.workspaceId);
        const { properties, status: updatedStepStatus, comments } = updatedData;
        const processServiceUpdateData: UpdateStepReqBody = updatedStepStatus
            ? { properties, statusReview: { status: updatedStepStatus, reviewerId: user._id }, comments, processId }
            : { properties, comments, processId };

        const process = await processInstancesManager.service.getProcessInstanceById(processId, user);
        const stepTemplate = await processInstancesManager.service.getStepTemplateByStepInstanceId(stepId);

        if (properties) await processInstancesManager.checkEntityReferenceFields(properties, stepTemplate.properties);

        if (!files.length) {
            // add remove old files
            const updatedStep = await this.service.updateStepInstance(stepId, processServiceUpdateData, user._id);
            const updatedProcess = await processInstancesManager.getProcessInstance(processId, user);
            if (updatedStepStatus) this.handleNotificationsOnUpdateStepInstance(updatedProcess, process, updatedStep);
            return this.getStepInstanceWithEntitiesAndReviewers(updatedStep, user);
        }

        const { props, files: filesToUpload } = await this.instancesManager.uploadInstanceFiles(files, processServiceUpdateData.properties);
        const { properties: oldProperties } = await processInstancesManager.service.getStepInstanceById(stepId);

        const updatedStep = await processInstancesManager.service
            .updateStepInstance(
                stepId,
                {
                    ...processServiceUpdateData,
                    properties: props,
                },
                user._id,
            )
            .catch(async (processServiceError) => {
                await this.storageService.deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch((deleteFilesError) => {
                    logger.error('failed to delete files error: ', { error: { deleteFilesError, processServiceError } });
                    throw processServiceError;
                });

                throw processServiceError;
            });

        if (oldProperties) await processInstancesManager.removeUnusedFileIds(stepTemplate.properties, oldProperties, { ...props });

        if (updatedData.status) {
            const updatedProcess = await processInstancesManager.getProcessInstance(processId, user);
            this.handleNotificationsOnUpdateStepInstance(updatedProcess, process, updatedStep);
        }

        return this.getStepInstanceWithEntitiesAndReviewers(updatedStep, user);
    }
}

export default StepsInstancesManager;
