import { Request, Response } from 'express';
import { IMongoEntityTemplate } from '@microservices/shared/src/interfaces/entityTemplate';
import DefaultController from '../../utils/express/controller';
import { EntityTemplateManager } from './manager';
import { fetchPropertyFromRequest } from '../../utils/express';

class EntityTemplateController extends DefaultController<IMongoEntityTemplate, EntityTemplateManager> {
    constructor(workspaceId: string) {
        super(new EntityTemplateManager(workspaceId));
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

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToUpsert = fetchPropertyFromRequest<string>(req, 'actions');
        res.json(await this.manager.updateEntityTemplateAction(id, actionToUpsert));
    }
}

export default EntityTemplateController;
