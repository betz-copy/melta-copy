import { Request, Response } from 'express';
import { DefaultController, IMongoRelationshipTemplate } from '@microservices/shared';
import { RelationshipTemplateManager } from './manager';

class RelationshipTemplateController extends DefaultController<IMongoRelationshipTemplate, RelationshipTemplateManager> {
    constructor(workspaceId: string) {
        super(new RelationshipTemplateManager(workspaceId));
    }

    async getTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getTemplateById(req.params.templateId));
    }

    async updateTemplateById(req: Request, res: Response) {
        res.json(await this.manager.updateTemplateById(req.params.templateId, req.body));
    }

    async deleteTemplateById(req: Request, res: Response) {
        res.json(await this.manager.deleteTemplateById(req.params.templateId));
    }

    async createTemplate(req: Request, res: Response) {
        res.json(await this.manager.createTemplate(req.body));
    }

    async searchTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchTemplates(req.body));
    }
}

export default RelationshipTemplateController;
