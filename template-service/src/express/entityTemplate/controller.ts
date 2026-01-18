import { IMongoEntityTemplate } from '@packages/entity-template';
import { DefaultController, fetchPropertyFromRequest } from '@packages/utils';
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
        res.json(await this.manager.getTemplateById(id as string));
    }

    async getTemplatesUsingRelationshipReference(req: Request, res: Response) {
        res.json(await this.manager.getTemplatesUsingRelationshipReference(req.params.relatedTemplateId as string));
    }

    async createEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.createTemplate(req.body));
    }

    async deleteEntityTemplate(req: Request, res: Response) {
        // TODO: validate no instances exists before deleting
        const { templateId: id } = req.params;
        res.json(await this.manager.deleteTemplate(id as string));
    }

    async updateEntityTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const { allowToDeleteRelationshipFields, ...restBody } = req.body;
        res.json(await this.manager.updateEntityTemplate(id as string, restBody, allowToDeleteRelationshipFields));
    }

    async updateEntityTemplateStatus(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.updateEntityTemplateStatus(id as string, req.body.disabled));
    }

    async convertToRelationshipField(req: Request, res: Response) {
        const { templateId, relationshipTemplateId } = req.params;
        res.json(await this.manager.convertToRelationshipField(templateId as string, relationshipTemplateId as string, req.body));
    }

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToUpsert = fetchPropertyFromRequest<string>(req, 'actions');
        res.json(await this.manager.updateEntityTemplateAction(id as string, actionToUpsert));
    }

    async getAllTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllTemplates());
    }
}

export default EntityTemplateController;
