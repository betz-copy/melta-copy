/* eslint-disable class-methods-use-this */
import { Request } from 'express';
import ajv from '../../../utils/ajv';
import DefaultController from '../../../utils/express/controller';
import { InstancePropertiesValidationError, ValidationError } from '../../error';
import { IProcessDetails } from '../../templates/processes/interface';
import ProcessTemplateManager from '../../templates/processes/manager';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import StepTemplateManager from '../../templates/steps/manager';
import StepInstanceManager from '../steps/manager';
import { CreateProcessReqBody, IProcessInstance, InstanceProperties, UpdateProcessReqBody } from './interface';
import ProcessInstanceManager from './manager';

export default class ProcessInstanceValidator extends DefaultController<IProcessInstance, ProcessInstanceManager> {
    private stepInstanceManager: StepInstanceManager;

    private stepTemplateManager: StepTemplateManager;

    private processTemplateManager: ProcessTemplateManager;

    constructor(dbName: string) {
        super(new ProcessInstanceManager(dbName));
        this.stepInstanceManager = new StepInstanceManager(dbName);
        this.stepTemplateManager = new StepTemplateManager(dbName);
        this.processTemplateManager = new ProcessTemplateManager(dbName);
    }

    validateInstanceProperties(instanceProperties: InstanceProperties, templateProperties: IProcessDetails['properties']) {
        const validate = ajv.compile(templateProperties);
        const isValid = validate(instanceProperties);

        if (!isValid) {
            throw new InstancePropertiesValidationError(JSON.stringify(validate.errors));
        }
    }

    validateReviewersNotInTemplate(instanceStepReviewersByTemplateStepIds: Record<string, string[]>, stepTemplates: IMongoStepTemplate[]) {
        Object.entries(instanceStepReviewersByTemplateStepIds).forEach(([templateStepId, reviewers]) => {
            const stepTemplate = stepTemplates.find((currStepTemplate) => String(currStepTemplate._id) === templateStepId);

            if (!stepTemplate) throw new ValidationError('step not found in template');

            if (stepTemplate.reviewers.some((templateReviewer) => reviewers.includes(templateReviewer))) {
                throw new ValidationError('reviewer already in template');
            }
        });
    }

    public async validateCreateProcessInstance(req: Request) {
        const { templateId, details, steps }: CreateProcessReqBody = req.body;

        const template = await this.processTemplateManager.getProcessTemplateById(templateId, false);
        const stepTemplates = await this.stepTemplateManager.getStepTemplates(template.steps);

        this.validateReviewersNotInTemplate(steps, stepTemplates);
        this.validateInstanceProperties(details, template.details.properties);
    }

    public async validateUpdateProcessInstance(req: Request) {
        const { steps, details }: UpdateProcessReqBody = req.body;

        const template = await this.manager.getProcessTemplateByProcessId(req.params.id);

        if (steps) {
            const [stepTemplates, stepInstances] = await Promise.all([
                this.stepTemplateManager.getStepTemplates(template.steps),
                this.stepInstanceManager.getSteps(Object.keys(steps)),
            ]);

            const instanceStepsWithTemplateStepIds: Record<string, string[]> = {};

            stepInstances.forEach((step) => {
                instanceStepsWithTemplateStepIds[step.templateId] = steps[step._id];
            });

            this.validateReviewersNotInTemplate(instanceStepsWithTemplateStepIds, stepTemplates);
        }

        if (details) {
            this.validateInstanceProperties(details, template.details.properties);
        }
    }
}
