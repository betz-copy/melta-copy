import { Request, Response } from 'express';
import { DefaultController, IProcessTemplate } from '@microservices/shared';
import ProcessTemplateManager from './manager';

export default class ProcessTemplateController extends DefaultController<IProcessTemplate, ProcessTemplateManager> {
    constructor(workspaceId: string) {
        super(new ProcessTemplateManager(workspaceId));
    }

    async getTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getProcessTemplateById(req.params.id));
    }

    async createTemplate(req: Request, res: Response) {
        res.json(await this.manager.createProcessTemplate(req.body));
    }

    async deleteTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteProcessTemplate(req.params.id));
    }

    async searchTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchTemplates(req.body));
    }
}
