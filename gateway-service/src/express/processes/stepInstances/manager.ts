import { isProcessManager } from '../../../externalServices/permissionsApi';
import { ProcessManagerService } from '../../../externalServices/processService';
import { IMongoProcessInstanceWithSteps, Status } from '../../../externalServices/processService/interfaces/processInstance';
import {
    IMongoStepInstance,
    IMongoStepInstancePopulated,
    IStepInstance,
    UpdateStepReqBody,
} from '../../../externalServices/processService/interfaces/stepInstance';
import { deleteFiles } from '../../../externalServices/storageService';
import { removeTmpFile } from '../../../utils/fs';
import { InstancesManager } from '../../instances/manager';
import UsersManager from '../../users/manager';
import { StepNotEditable, StepNotPartOfProcess } from '../error';
import ProcessesInstancesManager from '../processInstances/manager';

export default class StepsInstancesManager {
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
        updatedData: Partial<Pick<IStepInstance, 'properties' | 'status'>>,
        files: Express.Multer.File[],
        userId: string,
    ) {
        const { properties, status } = updatedData;
        const processServiceUpdateData: UpdateStepReqBody = status ? { properties, statusReview: { status, reviewerId: userId } } : { properties };
        const process = await ProcessManagerService.getProcessInstanceById(processId, userId);
        await this.validateIsStepEditable(stepId, process, userId);
        const stepTemplate = await ProcessManagerService.getStepTemplateByStepInstanceId(stepId);

        if (properties) await ProcessesInstancesManager.checkEntityReferenceFields(properties, stepTemplate.properties, userId);

        if (!files.length) {
            const step = await ProcessManagerService.updateStepInstance(stepId, processServiceUpdateData);
            return this.getStepInstanceWithEntitesAndReviewers(step, userId);
        }
        const filesProperties = await InstancesManager.uploadInstanceFiles(files);
        const regularProperties = processServiceUpdateData.properties;

        const newProperties = { ...regularProperties, ...filesProperties };
        const { properties: oldProperties } = await ProcessManagerService.getStepInstanceById(stepId);

        const step = await ProcessManagerService.updateStepInstance(stepId, { ...processServiceUpdateData, properties: newProperties }).catch(
            (processServiceError) => {
                deleteFiles(Object.values(filesProperties)).catch((deleteFilesError) => {
                    // eslint-disable-next-line no-console
                    console.log(`failed to delete files ${deleteFilesError}`);
                    throw processServiceError;
                });
                throw processServiceError;
            },
        );

        if (oldProperties) await ProcessesInstancesManager.removeUnusedFileIds(stepTemplate.properties, oldProperties, newProperties);
        await Promise.all(
            files.map((file) => {
                return removeTmpFile(file.path);
            }),
        );
        if (updatedData.status) {
            ProcessesInstancesManager.sendProcessStatusUpdateNotification(process, step.status, step._id);
        }
        return this.getStepInstanceWithEntitesAndReviewers(step, userId);
    }

    private static async validateIsStepEditable(stepId: string, process: IMongoProcessInstanceWithSteps, userId: string) {
        const step = process.steps.find((currStep) => currStep._id === stepId);

        if (!step) throw new StepNotPartOfProcess(stepId, process.name);
        if (process.status !== Status.Pending) throw new StepNotEditable(stepId);

        if ((await isProcessManager(userId)) || step.reviewers.includes(userId)) return;

        const processTemplate = await ProcessManagerService.getProcessTemplateById(process.templateId, userId);

        if (!processTemplate.steps.some((stepTemplate) => stepTemplate._id === step.templateId && stepTemplate.reviewers.includes(userId)))
            throw new StepNotEditable(stepId);
    }
}
