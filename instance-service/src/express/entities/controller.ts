import { Request, Response } from 'express';
import { RequestWithQuery, fetchPropertyFromRequest } from '../../utils/express';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';
import { EntityManager } from './manager';

class EntityController {
    static async createEntity(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(
            await EntityManager.createEntity(req.body.properties, entityTemplate, req.body.ignoredRules, req.body.userId, req.body.duplicatedFromId),
        );
    }

    static async searchEntitiesOfTemplate(req: Request, res: Response) {
        console.log('1');

        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await EntityManager.searchEntitiesOfTemplate(req.body, entityTemplate));
    }

    static async searchEntitiesBatch(req: Request, res: Response) {
        const entityTemplatesMap = fetchPropertyFromRequest<Map<string, IMongoEntityTemplate>>(req, 'entityTemplatesMap');

        res.json(await EntityManager.searchEntitiesBatch(req.body, entityTemplatesMap));
    }

    static async getEntityById(req: Request, res: Response) {
        res.json(await EntityManager.getEntityById(req.params.id));
    }

    static async getEntitiesByIds(req: Request, res: Response) {
        res.json(await EntityManager.getEntitiesByIds(req.body.ids));
    }

    static async getExpandedGraphById(req: Request, res: Response) {
        const entityTemplatesMap = fetchPropertyFromRequest<Map<string, IMongoEntityTemplate>>(req, 'entityTemplatesMap');
        res.json(await EntityManager.getExpandedGraphById(req.params.id, req.body, entityTemplatesMap, req.body.userId));
    }

    static async deleteEntityById(req: Request, res: Response) {
        res.json(await EntityManager.deleteEntityById(req.params.id, req.query.deleteAllRelationships as unknown as boolean));
    }

    static async deleteEntitiesByTemplateId(req: Request, res: Response) {
        res.json(await EntityManager.deleteByTemplateId(req.query.templateId as unknown as string));
    }

    static async updateStatusById(req: Request, res: Response) {
        res.json(await EntityManager.updateStatusById(req.params.id, req.body.disabled, req.body.ignoredRules, req.body.userId));
    }

    static async updateEntityById(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');
        res.json(await EntityManager.updateEntityById(req.params.id, req.body.properties, entityTemplate, req.body.ignoredRules, req.body.userId));
    }

    static async updateEnumFieldValue(req: Request, res: Response) {
        const { newValue, oldValue, field } = req.body;
        res.json(await EntityManager.updateEnumFieldValue(req.params.id, newValue, oldValue, field));
    }

    static async getIsFieldUsed(req: RequestWithQuery<{ fieldValue: string; fieldName: string; type: string }>, res: Response) {
        const { fieldValue, fieldName, type } = req.query;
        res.json(await EntityManager.getIsFieldUsed(req.params.id, fieldValue, fieldName, type));
    }

    static async getConstraintsOfTemplate(req: Request, res: Response) {
        res.json(await EntityManager.getConstraintsOfTemplate(req.params.templateId));
    }

    static async getAllConstraints(_req: Request, res: Response) {
        res.json(await EntityManager.getAllConstraints());
    }

    static async updateConstraintsOfTemplate(req: Request, res: Response) {
        const entityTemplate = fetchPropertyFromRequest<IMongoEntityTemplate>(req, 'entityTemplate');

        res.json(await EntityManager.updateConstraintsOfTemplate(entityTemplate, req.body.requiredConstraints, req.body.uniqueConstraints));
    }

    static async enumerateNewSerialNumberFields(req: Request, res: Response) {
        res.json(await EntityManager.enumerateNewSerialNumberFields(req.params.templateId, req.body.newSerialNumberFields));
    }
}

export default EntityController;
