import { Request } from 'express';
import ajv from '../../../utils/ajv';
import DefaultController from '../../../utils/express/controller';
import { InstancePropertiesValidationError } from '../../error';
import { IStepInstance, UpdateStepReqBody } from './interface';
import StepInstanceManager from './manager';

export default class StepInstanceValidator extends DefaultController<IStepInstance, StepInstanceManager> {
    constructor(dbName: string) {
        super(new StepInstanceManager(dbName));
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
