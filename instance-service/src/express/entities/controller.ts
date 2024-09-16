import { Request, Response } from 'express';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';
import { fetchPropertyFromRequest, RequestWithQuery } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import { EntityManager } from './manager';

class EntityController extends DefaultController<EntityManager> {
    constructor(workspaceId: string) {
        super(new EntityManager(workspaceId));
    }

    async createEntity(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(
            await this.manager.createEntity(req.body.properties, entityTemplate, req.body.ignoredRules, req.body.userId, req.body.duplicatedFromId),
        );
    }

    async searchEntitiesOfTemplate(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await this.manager.searchEntitiesOfTemplate(req.body, entityTemplate));
    }

    async searchEntitiesByTemplates(req: Request, res: Response) {
        const entityTemplatesMap = fetchPropertyFromRequest<Map<string, IMongoEntityTemplate>>(req, 'entityTemplatesMap');

        console.log('entityTemplatesMap', entityTemplatesMap);

        res.json(await this.manager.searchEntitiesByTemplates(req.body));
    }

    async getEntitiesCountByTemplates(req: Request, res: Response) {
        res.json(await this.manager.getEntitiesCountByTemplates(req.body.templateIds, req.body.textSearch));
    }

    async searchEntitiesBatch(req: Request, res: Response) {
        const entityTemplatesMap = fetchPropertyFromRequest<Map<string, IMongoEntityTemplate>>(req, 'entityTemplatesMap');

        res.json(await this.manager.searchEntitiesBatch(req.body, entityTemplatesMap));
    }

    async getEntityById(req: Request, res: Response) {
        res.json(await this.manager.getEntityById(req.params.id));
    }

    async getEntitiesByIds(req: Request, res: Response) {
        res.json(await this.manager.getEntitiesByIds(req.body.ids));
    }

    async getExpandedGraphById(req: Request, res: Response) {
        const entityTemplatesMap = fetchPropertyFromRequest<Map<string, IMongoEntityTemplate>>(req, 'entityTemplatesMap');
        res.json(await this.manager.getExpandedGraphById(req.params.id, req.body, entityTemplatesMap, req.body.userId));
    }

    async deleteEntityById(req: Request, res: Response) {
        res.json(await this.manager.deleteEntityById(req.params.id, req.query.deleteAllRelationships as unknown as boolean));
    }

    async deleteEntitiesByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.deleteByTemplateId(req.query.templateId as unknown as string));
    }

    async updateStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateStatusById(req.params.id, req.body.disabled, req.body.ignoredRules, req.body.userId));
    }

    async updateEntityById(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');
        res.json(await this.manager.updateEntityById(req.params.id, req.body.properties, entityTemplate, req.body.ignoredRules, req.body.userId));
    }

    async updateEnumFieldValue(req: Request, res: Response) {
        const { newValue, oldValue, field } = req.body;
        res.json(await this.manager.updateEnumFieldValue(req.params.id, newValue, oldValue, field));
    }

    async getIsFieldUsed(req: Request, res: Response) {
        const { fieldValue, fieldName, type } = (req as RequestWithQuery<{ fieldValue: string; fieldName: string; type: string }>).query;
        res.json(await this.manager.getIsFieldUsed(req.params.id, fieldValue, fieldName, type));
    }

    async getConstraintsOfTemplate(req: Request, res: Response) {
        res.json(await this.manager.getConstraintsOfTemplate(req.params.templateId));
    }

    async getAllConstraints(_req: Request, res: Response) {
        res.json(await this.manager.getAllConstraints());
    }

    async updateConstraintsOfTemplate(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await this.manager.updateConstraintsOfTemplate(entityTemplate, req.body.requiredConstraints, req.body.uniqueConstraints));
    }

    async enumerateNewSerialNumberFields(req: Request, res: Response) {
        res.json(await this.manager.enumerateNewSerialNumberFields(req.params.templateId, req.body.newSerialNumberFields));
    }
}

export default EntityController;
