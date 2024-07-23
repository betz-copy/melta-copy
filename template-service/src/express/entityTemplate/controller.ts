import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { IEntityTemplate } from './interface';
import { EntityTemplateManager } from './manager';

class EntityTemplateController extends DefaultController<IEntityTemplate, EntityTemplateManager> {
    constructor(dbName: string) {
        super(new EntityTemplateManager(dbName));
    }

    async searchEntityTemplates(req: Request, res: Response) {
        res.json(await this.manager.getTemplates(req.body));
    }

    async getEntityTemplateById(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.getTemplateById(id));
    }

    async getTemplatesUsingRelationshipReferance(req: Request, res: Response) {
        res.json(await this.manager.getTemplatesUsingRelationshipReferance(req.params.relatedTemplateId));
    }

    async createEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.createTemplate(req.body));
    }

    async deleteEntityTemplate(req: Request, res: Response) {
        // TODO: validate no instances exists before deleting
        const { templateId: id } = req.params;
        res.json(await this.manager.deleteTemplate(id));
    }

    async updateEntityTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.updateEntityTemplate(id, req.body));
    }

    async updateEntityTemplateStatus(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.updateEntityTemplateStatus(id, req.body.disabled));
    }
}

export default EntityTemplateController;
