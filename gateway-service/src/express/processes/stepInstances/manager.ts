import { StatusCodes } from 'http-status-codes';
import { ProcessManagerService } from '../../../externalServices/processService';
import { IMongoProcessInstancePopulated, IMongoProcessInstanceWithSteps } from '../../../externalServices/processService/interfaces/processInstance';
import {
    IMongoStepInstance,
    IMongoStepInstancePopulated,
    IStepInstance,
    UpdateStepReqBody,
} from '../../../externalServices/processService/interfaces/stepInstance';
import { deleteFiles } from '../../../externalServices/storageService';
import { removeTmpFile } from '../../../utils/fs';
import { ServiceError } from '../../error';
import { InstancesManager } from '../../instances/manager';
import UsersManager from '../../users/manager';
import ProcessesInstancesManager from '../processInstances/manager';

export default class StepsInstancesManager {
    private static async handleNotificationsOnUpdateStepInstance(
        process: IMongoProcessInstancePopulated,
        previousProcess: IMongoProcessInstanceWithSteps,
        updatedStep: IMongoStepInstance,
    ) {
        await Promise.allSettled([
            ProcessesInstancesManager.sendProcessStatusUpdateNotification(process, updatedStep.status, updatedStep._id),
            process.status !== previousProcess.status
                ? ProcessesInstancesManager.sendProcessStatusUpdateNotification(process, process.status)
                : undefined,
        ]);
    }

    static async getStepInstanceWithEntitesAndReviewers(step: IMongoStepInstance, userId: string): Promise<IMongoStepInstancePopulated> {
        const stepTemplate = await ProcessManagerService.getStepTemplateByStepInstanceId(step._id);
        const reviewerPromise = step.reviewerId ? UsersManager.getUserById(step.reviewerId) : Promise.resolve(undefined);
        const populatedReviewersPromise = Promise.all(step.reviewers.map((id) => UsersManager.getUserById(id)));
        const propertiesPromise =
            step.properties && ProcessesInstancesManager.getPropertiesWithEntities(step.properties, stepTemplate.properties, userId);
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

    static async updateStep(
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

        const process = await ProcessManagerService.getProcessInstanceById(processId, userId);
        const stepTemplate = await ProcessManagerService.getStepTemplateByStepInstanceId(stepId);
        if (properties) await ProcessesInstancesManager.checkEntityReferenceFields(properties, stepTemplate.properties);
        if (!files.length) {
            // add remove old files
            const updatedStep = await ProcessManagerService.updateStepInstance(stepId, processServiceUpdateData);
            const updatedProcess = await ProcessesInstancesManager.getProcessInstance(processId, userId);
            if (updatedStepStatus) this.handleNotificationsOnUpdateStepInstance(updatedProcess, process, updatedStep);
            return this.getStepInstanceWithEntitesAndReviewers(updatedStep, userId);
        }
        const { props, files: filesToUpload } = await InstancesManager.uploadInstanceFiles(files, processServiceUpdateData.properties);
        const { properties: oldProperties } = await ProcessManagerService.getStepInstanceById(stepId);
        const updatedStep = await ProcessManagerService.updateStepInstance(stepId, {
            ...processServiceUpdateData,
            properties: props,
        }).catch((processServiceError) => {
            deleteFiles(Object.values(filesToUpload).flat(1) as string[]).catch((deleteFilesError) => {
                throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'failed to delete files error', {
                    error: { deleteFilesError, processServiceError },
                });
            });
            throw processServiceError;
        });
        if (oldProperties) await ProcessesInstancesManager.removeUnusedFileIds(stepTemplate.properties, oldProperties, { ...props });
        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );
        if (updatedData.status) {
            const updatedProcess = await ProcessesInstancesManager.getProcessInstance(processId, userId);
            this.handleNotificationsOnUpdateStepInstance(updatedProcess, process, updatedStep);
        }
        return this.getStepInstanceWithEntitesAndReviewers(updatedStep, userId);
    }
}
