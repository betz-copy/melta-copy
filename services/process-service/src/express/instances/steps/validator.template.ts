import { Request } from 'express';
import { IStepInstance, UpdateStepReqBody } from '@microservices/shared/src/interfaces/process/instances/step';
import ajv from '../../../utils/ajv';
import DefaultController from '../../../utils/express/controller';
import { InstancePropertiesValidationError } from '../../error';
import StepInstanceManager from './manager';

export default class StepInstanceValidator extends DefaultController<IStepInstance, StepInstanceManager> {
    constructor(workspaceId: string) {
        super(new StepInstanceManager(workspaceId));
    }

    public async validateStepInstance(req: Request) {
        const { properties: stepInstanceProp } = req.body as UpdateStepReqBody;
        if (!stepInstanceProp) return;

        const { id: stepId } = req.params;
        const stepTemplate = await this.manager.getStepTemplateByStepInstanceId(stepId);
        const validateStep = ajv.compile(stepTemplate.properties);
        const stepIsValid = validateStep(stepInstanceProp);
        if (!stepIsValid) {
            throw new InstancePropertiesValidationError(JSON.stringify(validateStep.errors));
        }
    }
}
