import { DefaultController, fetchPropertyFromRequest, IMongoEntityTemplate } from '@microservices/shared';
import { Request, Response } from 'express';
import { EntityTemplateManager } from './manager';

class EntityTemplateController extends DefaultController<IMongoEntityTemplate, EntityTemplateManager> {
    constructor(workspaceId: string) {
        super(new EntityTemplateManager(workspaceId));
    }

    async searchEntityTemplates(req: Request, res: Response) {
        res.json(await this.manager.getTemplates(req.body));
    }

    async searchEntityTemplatesIncludesFormat(req: Request, res: Response) {
        res.json(await this.manager.getTemplatesByFormat(req.body));
    }

    async getEntityTemplateById(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.getTemplateById(id));
    }

    async getTemplatesUsingRelationshipReference(req: Request, res: Response) {
        res.json(await this.manager.getTemplatesUsingRelationshipReference(req.params.relatedTemplateId));
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
        const { allowToDeleteRelationshipFields, ...restBody } = req.body;
        res.json(await this.manager.updateEntityTemplate(id, restBody, allowToDeleteRelationshipFields));
    }

    async updateEntityTemplateStatus(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.updateEntityTemplateStatus(id, req.body.disabled));
    }

    async convertToRelationshipField(req: Request, res: Response) {
        const { templateId, relationshipTemplateId } = req.params;
        res.json(await this.manager.convertToRelationshipField(templateId, relationshipTemplateId, req.body));
    }

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToUpsert = fetchPropertyFromRequest<string>(req, 'actions');
        res.json(await this.manager.updateEntityTemplateAction(id, actionToUpsert));
    }

    async getAllTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllTemplates());
    }
}

export default EntityTemplateController;
