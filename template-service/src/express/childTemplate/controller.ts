import { Request, Response } from 'express';
import { DefaultController, fetchPropertyFromRequest, IMongoChildTemplate } from '@microservices/shared';
import ChildTemplateManager from './manager';

class ChildTemplateController extends DefaultController<IMongoChildTemplate, ChildTemplateManager> {
    constructor(workspaceId: string) {
        super(new ChildTemplateManager(workspaceId));
    }

    async searchChildTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchChildTemplates(req.body));
    }

    async createChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.createChildTemplate(req.body));
    }

    async getAllChildTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllChildTemplates());
    }

    async getChildTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getChildTemplateById(req.params.id));
    }

    async updateChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateChildTemplate(req.params.id, req.body));
    }

    async deleteChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteChildTemplate(req.params.id));
    }

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToUpsert = fetchPropertyFromRequest<string>(req, 'actions');

        res.json(await this.manager.updateEntityTemplateAction(id, actionToUpsert));
    }
}

export default ChildTemplateController;
