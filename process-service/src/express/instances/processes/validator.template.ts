/* eslint-disable class-methods-use-this */

import {
    CreateProcessReqBody,
    IMongoStepInstance,
    IMongoStepTemplate,
    InstanceProperties,
    IProcessDetails,
    IProcessInstance,
    UpdateProcessReqBody,
} from '@packages/process';
import { DefaultController, ValidationError } from '@packages/utils';
import { Request } from 'express';
import ajv from '../../../utils/ajv';
import { InstancePropertiesValidationError } from '../../error';
import ProcessTemplateManager from '../../templates/processes/manager';
import StepInstanceManager from '../steps/manager';
import ProcessInstanceManager from './manager';

export default class ProcessInstanceValidator extends DefaultController<IProcessInstance, ProcessInstanceManager> {
    private stepInstanceManager: StepInstanceManager;

    private processTemplateManager: ProcessTemplateManager;

    constructor(workspaceId: string) {
        super(new ProcessInstanceManager(workspaceId));
        this.stepInstanceManager = new StepInstanceManager(workspaceId);
        this.processTemplateManager = new ProcessTemplateManager(workspaceId);
    }

    validateInstanceProperties(instanceProperties: InstanceProperties, templateProperties: IProcessDetails['properties']) {
        const validate = ajv.compile(templateProperties);
        const isValid = validate(instanceProperties);

        if (!isValid) {
            throw new InstancePropertiesValidationError(JSON.stringify(validate.errors));
        }
    }

    validateReviewersNotInTemplate(
        instanceStepReviewersByTemplateStepIds: Record<string, string[]>,
        stepTemplates: IMongoStepTemplate[],
        stepInstances: IMongoStepInstance[],
    ) {
        Object.entries(instanceStepReviewersByTemplateStepIds).forEach(([templateStepId, reviewers]) => {
            const stepTemplate = stepTemplates.find((currStepTemplate) => String(currStepTemplate._id) === templateStepId);

            if (!stepTemplate) throw new ValidationError('step not found in template');

            if (stepTemplate.reviewers.some((templateReviewer) => reviewers.includes(templateReviewer))) {
                throw new ValidationError('reviewer already in template');
            }

            if (stepTemplate.disableAddingReviewers) {
                const currStepInstance = stepInstances.find((step) => step.templateId === templateStepId);
                const currReviewers = currStepInstance ? currStepInstance.reviewers : stepTemplate.reviewers;

                if (reviewers.some((reviewer) => !currReviewers.includes(reviewer)))
                    throw new ValidationError(`not allowed to add reviewers to step ${templateStepId}`);
            }
        });
    }

    public async validateCreateProcessInstance(req: Request) {
        const { templateId, details, steps }: CreateProcessReqBody = req.body;

        const template = await this.processTemplateManager.getProcessTemplateById(templateId, false);

        if (steps) {
            const stepTemplates = await this.processTemplateManager.stepTemplateManager.getStepTemplates(template.steps);

            this.validateReviewersNotInTemplate(steps, stepTemplates, []);
        }
        this.validateInstanceProperties(details, template.details.properties);
    }

    public async validateUpdateProcessInstance(req: Request) {
        const { steps, details }: UpdateProcessReqBody = req.body;

        const template = await this.manager.getProcessTemplateByProcessId(req.params.id);

        if (steps) {
            const [stepTemplates, stepInstances] = await Promise.all([
                this.processTemplateManager.stepTemplateManager.getStepTemplates(template.steps),
                this.stepInstanceManager.getSteps(Object.keys(steps)),
            ]);

            const instanceStepsWithTemplateStepIds: Record<string, string[]> = {};

            stepInstances.forEach((step) => {
                instanceStepsWithTemplateStepIds[step.templateId] = steps[step._id];
            });

            this.validateReviewersNotInTemplate(instanceStepsWithTemplateStepIds, stepTemplates, stepInstances);
        }

        if (details) {
            this.validateInstanceProperties(details, template.details.properties);
        }
    }
}
