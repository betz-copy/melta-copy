import { Request, Response } from 'express';
import { DefaultController } from '@microservices/shared';
import { IMongoEntityChildTemplate } from './interface';
import EntityChildTemplateManager from './manager';

class EntityChildTemplateController extends DefaultController<IMongoEntityChildTemplate, EntityChildTemplateManager> {
    constructor(workspaceId: string) {
        super(new EntityChildTemplateManager(workspaceId));
    }

    async searchEntityChildTemplates(req: Request, res: Response) {
        res.json(await this.manager.getChildTemplates(req.body));
    }

    async createEntityChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.createChildTemplate(req.body));
    }

    async getAllChildTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllChildTemplates());
    }
}

export default EntityChildTemplateController;
