import { Request, Response } from 'express';
import { IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { fetchPropertyFromRequest } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import EntityManager from './manager';

class EntityController extends DefaultController<EntityManager> {
    constructor(dbName: string) {
        super(new EntityManager(dbName));
    }

    async createEntity(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await this.manager.createEntity(req.body, entityTemplate));
    }

    async searchEntitiesOfTemplate(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await this.manager.searchEntitiesOfTemplate(req.body, entityTemplate));
    }

    async searchEntitiesBatch(req: Request, res: Response) {
        const entityTemplatesMap = fetchPropertyFromRequest<Map<string, IMongoEntityTemplate>>(req, 'entityTemplatesMap');

        res.json(await this.manager.searchEntitiesBatch(req.body, entityTemplatesMap));
    }

    async getEntityById(req: Request, res: Response) {
        res.json(await this.manager.getEntityById(req.params.id));
    }

    async getExpandedEntityById(req: Request, res: Response) {
        const { disabled, numberOfConnections, templateIds } = req.body;

        res.json(await this.manager.getExpandedEntityById(req.params.id, disabled as unknown as boolean, templateIds, numberOfConnections));
    }

    async deleteEntityById(req: Request, res: Response) {
        res.json(await this.manager.deleteEntityById(req.params.id, req.query.deleteAllRelationships as unknown as boolean));
    }

    async deleteEntitiesByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.deleteByTemplateId(req.query.templateId as unknown as string));
    }

    async updateStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateStatusById(req.params.id, req.body.disabled, req.body.ignoredRules));
    }

    async updateEntityById(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await this.manager.updateEntityById(req.params.id, req.body.properties, entityTemplate, req.body.ignoredRules));
    }

    async getConstraintsOfTemplate(req: Request, res: Response) {
        res.json(await this.manager.getConstraintsOfTemplate(req.params.templateId));
    }

    async getAllConstraints(_req: Request, res: Response) {
        res.json(await this.manager.getAllConstraints());
    }

    async updateConstraintsOfTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateConstraintsOfTemplate(req.params.templateId, req.body));
    }
}

export default EntityController;
