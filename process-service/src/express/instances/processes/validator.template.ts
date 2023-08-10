import { Request } from 'express';
import ProcessTemplateManager from '../../templates/processes/manager';
import { InstancePropertiesValidationError, ValidationError } from '../../error';
import { IProcessDetails } from '../../templates/processes/interface';
import { CreateProcessReqBody, InstanceProperties, UpdateProcessReqBody } from './interface';
import ProcessInstanceManager from './manager';
import ajv from '../../../utils/ajv';
import { IMongoStepTemplate } from '../../templates/steps/interface';
import StepTemplateManager from '../../templates/steps/manager';
import StepInstanceManager from '../steps/manager';

export const validateStepIds = (validStepIds: string[], stepIdsToCheck: string[]) => {
    if (validStepIds.length !== stepIdsToCheck.length) throw new ValidationError('number of steps not matched the template');
    const unmatchedStepTemplateIds = stepIdsToCheck.filter((item) => !validStepIds.includes(item));
    if (unmatchedStepTemplateIds.length) throw new ValidationError('unmatched step ids');
};

const validateInstanceProperties = (instanceProperties: InstanceProperties, templateProperties: IProcessDetails['properties']) => {
    const validate = ajv.compile(templateProperties);
    const isValid = validate(instanceProperties);

    if (!isValid) {
        throw new InstancePropertiesValidationError(JSON.stringify(validate.errors));
    }
};

const validateReviewersNotInTemplate = (instanceStepReviewersByTemplateStepIds: Record<string, string[]>, stepTemplates: IMongoStepTemplate[]) => {
    Object.entries(instanceStepReviewersByTemplateStepIds).forEach(([templateStepId, reviewers]) => {
        const stepTemplate = stepTemplates.find((currStepTemplate) => String(currStepTemplate._id) === templateStepId);

        if (!stepTemplate) throw new ValidationError('step not found in template');

        if (stepTemplate.reviewers.some((templateReviewer) => reviewers.includes(templateReviewer))) {
            throw new ValidationError('reviewer already in template');
        }
    });
};

export const validateCreateProcessInstance = async (req: Request) => {
    const { templateId, details, steps }: CreateProcessReqBody = req.body;

    const template = await ProcessTemplateManager.getProcessTemplateById(templateId, false);
    const stepTemplates = await StepTemplateManager.getStepTemplates(template.steps);

    validateReviewersNotInTemplate(steps, stepTemplates);
    validateInstanceProperties(details, template.details.properties);
};

export const validateUpdateProcessInstance = async (req: Request) => {
    const { steps, details }: UpdateProcessReqBody = req.body;

    const template = await ProcessInstanceManager.getProcessTemplateByProcessId(req.params.id);

    if (steps) {
        const [stepTemplates, stepInstances] = await Promise.all([
            StepTemplateManager.getStepTemplates(template.steps),
            StepInstanceManager.getSteps(Object.keys(steps)),
        ]);

        const instanceStepsWithTemplateStepIds: Record<string, string[]> = {};

        stepInstances.forEach((step) => {
            instanceStepsWithTemplateStepIds[step.templateId] = steps[step._id];
        });

        validateReviewersNotInTemplate(instanceStepsWithTemplateStepIds, stepTemplates);
    }

    if (details) {
        validateInstanceProperties(details, template.details.properties);
    }
};
