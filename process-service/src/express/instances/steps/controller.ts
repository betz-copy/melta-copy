import { IStepInstance } from '@packages/process';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
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
        const { userId, ...updatedFields } = req.body;

        res.json(await this.manager.updateStep(req.params.id, updatedFields, userId));
    }
}
