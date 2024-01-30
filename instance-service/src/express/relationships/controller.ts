import { Request, Response } from 'express';
import { IMongoRelationshipTemplate } from '../../externalServices/relationshipTemplateManager';
import { fetchPropertyFromRequest } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import { RelationshipManager } from './manager';

class RelationshipController extends DefaultController<RelationshipManager> {
    constructor(dbName: string) {
        super(new RelationshipManager(dbName));
    }

    async createRelationship(req: Request, res: Response) {
        const relationshipTemplate = fetchPropertyFromRequest<IMongoRelationshipTemplate>(req, 'relationshipTemplate');

        res.json(await this.manager.createRelationshipByEntityIds(req.body.relationshipInstance, relationshipTemplate, req.body.ignoredRules));
    }

    async getRelationshipById(req: Request, res: Response) {
        res.json(await this.manager.getRelationshipById(req.params.id));
    }

    async getRelationshipsCountByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.getRelationshipsCountByTemplateId(req.query.templateId as unknown as string));
    }

    async getRelationshipsConnectionsById(req: Request, res: Response) {
        res.json(await this.manager.getRelationshipsConnectionsById(req.body.ids));
    }

    async deleteRelationshipById(req: Request, res: Response) {
        res.json(await this.manager.deleteRelationshipById(req.params.id, req.body.ignoredRules));
    }

    async updateRelationshipPropertiesById(req: Request, res: Response) {
        res.json(await this.manager.updateRelationshipPropertiesById(req.params.id, req.body.properties));
    }
}

export default RelationshipController;
