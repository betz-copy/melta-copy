import { Request } from 'express';
import { InstancePropertiesValidationError } from '../../error';
import StepInstanceManager from './manager';
import ajv from '../../../utils/ajv';
import { UpdateStepReqBody } from './interface';

const validateStepInstance = async (req: Request) => {
    const { properties: stepInstanceProp } = req.body as UpdateStepReqBody;
    if (!stepInstanceProp) return;

    const { id: stepId } = req.params;
    const stepTemplate = await StepInstanceManager.getStepTemplateByStepInstanceId(stepId);
    const validateStep = ajv.compile(stepTemplate.properties);
    const stepIsValid = validateStep(stepInstanceProp);
    if (!stepIsValid) {
        throw new InstancePropertiesValidationError(JSON.stringify(validateStep.errors));
    }
};

export default validateStepInstance;
