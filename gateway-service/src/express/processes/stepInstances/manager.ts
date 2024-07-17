import { ProcessService } from '../../../externalServices/processService';
import { IMongoProcessInstancePopulated, IMongoProcessInstanceWithSteps } from '../../../externalServices/processService/interfaces/processInstance';
import {
    IMongoStepInstance,
    IMongoStepInstancePopulated,
    IStepInstance,
    UpdateStepReqBody,
} from '../../../externalServices/processService/interfaces/stepInstance';
import { StorageService } from '../../../externalServices/storageService';
import DefaultManagerProxy from '../../../utils/express/manager';
import { removeTmpFile } from '../../../utils/fs';
import { InstancesManager } from '../../instances/manager';
import { UsersManager } from '../../users/manager';
import ProcessesInstancesManager from '../processInstances/manager';

export default class StepsInstancesManager extends DefaultManagerProxy<ProcessService> {
    private storageService: StorageService;

    private instancesManager: InstancesManager;

    private processInstancesManager: ProcessesInstancesManager;

    constructor(workspaceId: string) {
        super(new ProcessService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.instancesManager = new InstancesManager(workspaceId);
        this.processInstancesManager = new ProcessesInstancesManager(workspaceId);
    }

    private async handleNotificationsOnUpdateStepInstance(
        process: IMongoProcessInstancePopulated,
        previousProcess: IMongoProcessInstanceWithSteps,
        updatedStep: IMongoStepInstance,
    ) {
        await Promise.allSettled([
            this.processInstancesManager.sendProcessStatusUpdateNotification(process, updatedStep.status, updatedStep._id),
            process.status !== previousProcess.status
                ? this.processInstancesManager.sendProcessStatusUpdateNotification(process, process.status)
                : undefined,
        ]);
    }

    async getStepInstanceWithEntitesAndReviewers(step: IMongoStepInstance, userId: string): Promise<IMongoStepInstancePopulated> {
        const stepTemplate = await this.service.getStepTemplateByStepInstanceId(step._id);
        const reviewerPromise = step.reviewerId ? UsersManager.getUserById(step.reviewerId) : Promise.resolve(undefined);
        const populatedReviewersPromise = Promise.all(step.reviewers.map((id) => UsersManager.getUserById(id)));
        const propertiesPromise =
            step.properties && this.processInstancesManager.getPropertiesWithEntities(step.properties, stepTemplate.properties, userId);
        return Promise.all([reviewerPromise, populatedReviewersPromise, propertiesPromise]).then(([reviewer, populatedReviewers, properties]) => {
            const { reviewerId, ...populatedStep } = {
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
        files: Express.Multer.File[],
        userId: string,
    ) {
        const { properties, status: updatedStepStatus, comments } = updatedData;
        const processServiceUpdateData: UpdateStepReqBody = updatedStepStatus
            ? { properties, statusReview: { status: updatedStepStatus, reviewerId: userId }, comments, processId }
            : { properties, comments, processId };

        const process = await this.service.getProcessInstanceById(processId, userId);
        const stepTemplate = await this.service.getStepTemplateByStepInstanceId(stepId);
        if (properties) await this.processInstancesManager.checkEntityReferenceFields(properties, stepTemplate.properties);
        if (!files.length) {
            // add remove old files
            const updatedStep = await this.service.updateStepInstance(stepId, processServiceUpdateData);
            const updatedProcess = await this.processInstancesManager.getProcessInstance(processId, userId);
            if (updatedStepStatus) this.handleNotificationsOnUpdateStepInstance(updatedProcess, process, updatedStep);
            return this.getStepInstanceWithEntitesAndReviewers(updatedStep, userId);
        }
        const { props, files: filesToUpload } = await this.instancesManager.uploadInstanceFiles(files, processServiceUpdateData.properties);
        const { properties: oldProperties } = await this.service.getStepInstanceById(stepId);
        const updatedStep = await this.service
            .updateStepInstance(stepId, {
                ...processServiceUpdateData,
                properties: props,
            })
            .catch((processServiceError) => {
                this.storageService.deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch((deleteFilesError) => {
                    // eslint-disable-next-line no-console
                    console.log(`failed to delete files ${deleteFilesError}`);
                    throw processServiceError;
                });
                throw processServiceError;
            });
        if (oldProperties) await this.processInstancesManager.removeUnusedFileIds(stepTemplate.properties, oldProperties, { ...props });
        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );
        if (updatedData.status) {
            const updatedProcess = await this.processInstancesManager.getProcessInstance(processId, userId);
            this.handleNotificationsOnUpdateStepInstance(updatedProcess, process, updatedStep);
        }
        return this.getStepInstanceWithEntitesAndReviewers(updatedStep, userId);
    }
}
