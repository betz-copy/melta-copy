import { Request, Response } from 'express';
import { DefaultController, fetchPropertyFromRequest } from '@microservices/shared';
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

    async getChildTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getChildTemplateById(req.params.id));
    }

    async updateEntityChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateChildTemplate(req.params.id, req.body));
    }

    async deleteEntityChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteChildTemplate(req.params.id));
    }

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToUpsert = fetchPropertyFromRequest<string>(req, 'actions');

        res.json(await this.manager.updateEntityTemplateAction(id, actionToUpsert));
    }

    async getEntityChildTemplateById(req: Request, res: Response) {
        const { id } = req.params;
        res.json(await this.manager.getChildTemplateById(id));
    }
}

export default EntityChildTemplateController;
