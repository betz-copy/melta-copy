import Ajv from 'ajv';
import { Request } from 'express';
import { trycatch } from '../../utils';
import TemplateManager from '../processTemplate/manager';
import { ValidationError } from '../error';
import { IProcessStepTemplate } from '../processTemplate/interface';

const ajv = new Ajv();

export const getProcessTemplate = async (templateId: string) => {
    const { result, err } = await trycatch(() => TemplateManager.getTemplateById(templateId));

    if (err || !result) throw new ValidationError(`Process template doesn't exist (id: "${templateId}")`);
    return result;
};

export const validateProcessInstance = async (req: Request) => {
    const { templateId, details: instanceDetails, steps: instanceSteps } = req.body;
    const { details: templateDetails, steps: templateSteps } = await getProcessTemplate(templateId);
    const validateDetails = ajv.compile(templateDetails.properties);
    const processDetailsIsValid = validateDetails(instanceDetails.properties);
    if (!processDetailsIsValid) {
        throw new ValidationError(`Process details does not match template details schema: ${JSON.stringify(validateDetails.errors)}`);
    }

    const errors: string[] = [];
    templateSteps.forEach((templateStep: IProcessStepTemplate, index: number) => {
        const validateStep = ajv.compile(templateStep.properties);
        const instanceStepIsValid = validateStep(instanceSteps[index].properties);
        if (!instanceStepIsValid) {
            errors.push(`Process instance step number ${index} does not match template step schema: ${JSON.stringify(validateStep.errors)}`);
        }
    });

    if (errors.length) {
        throw new ValidationError(errors.join());
    }
};
