import { Request, Response } from 'express';
import { fetchPropertyFromRequest } from '../../utils/express';
import { IMongoRelationshipTemplate } from '../../externalServices/relationshipTemplateManager';
import { RelationshipManager } from './manager';

class RelationshipController {
    static async createRelationship(req: Request, res: Response) {
        const relationshipTemplate = fetchPropertyFromRequest<IMongoRelationshipTemplate>(req, 'relationshipTemplate');

        res.json(await RelationshipManager.createRelationshipByEntityIds(req.body.relationshipInstance, relationshipTemplate, req.body.ignoredRules));
    }

    static async getRelationshipById(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipById(req.params.id));
    }

    static async getRelationshipsCountByTemplateId(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipsCountByTemplateId(req.query.templateId as unknown as string));
    }

    static async getRelationshipsConnectionsById(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipsConnectionsById(req.body.ids));
    }

    static async deleteRelationshipById(req: Request, res: Response) {
        res.json(await RelationshipManager.deleteRelationshipById(req.params.id, req.body.ignoredRules));
    }

    static async updateRelationshipPropertiesById(req: Request, res: Response) {
        res.json(await RelationshipManager.updateRelationshipPropertiesById(req.params.id, req.body.properties));
    }
}

export default RelationshipController;
