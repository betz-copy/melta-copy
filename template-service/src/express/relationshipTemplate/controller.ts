import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import { RelationshipTemplateManager } from './manager';

class RelationshipTemplateController extends DefaultController<IMongoRelationshipTemplate, RelationshipTemplateManager> {
    constructor(workspaceId: string) {
        super(new RelationshipTemplateManager(workspaceId));
    }

    async getTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getTemplateById(req.params.templateId as string));
    }

    async updateTemplateById(req: Request, res: Response) {
        res.json(await this.manager.updateTemplateById(req.params.templateId as string, req.body));
    }

    async deleteTemplateById(req: Request, res: Response) {
        res.json(await this.manager.deleteTemplateById(req.params.templateId as string));
    }

    async createTemplate(req: Request, res: Response) {
        res.json(await this.manager.createTemplate(req.body));
    }

    async searchTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchTemplates(req.body));
    }
}

export default RelationshipTemplateController;
