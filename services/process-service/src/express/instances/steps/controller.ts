import { Request, Response } from 'express';
import { IStepInstance } from '@microservices/shared';
import DefaultController from '../../../utils/express/controller';
import StepInstanceManager from './manager';

export default class StepInstanceController extends DefaultController<IStepInstance, StepInstanceManager> {
    constructor(workspaceId: string) {
        super(new StepInstanceManager(workspaceId));
    }

    async getStepById(req: Request, res: Response) {
        res.json(await this.manager.getStepById(req.params.id));
    }

    async getStepTemplateByStepInstanceId(req: Request, res: Response) {
        res.json(await this.manager.getStepTemplateByStepInstanceId(req.params.id));
    }

    async updateStep(req: Request, res: Response) {
        res.json(await this.manager.updateStep(req.params.id, req.body));
    }
}
