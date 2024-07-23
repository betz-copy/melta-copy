import { Request, Response } from 'express';
import { fetchPropertyFromRequest } from '../../utils/express';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { RelationshipManager } from './manager';
import DefaultController from '../../utils/express/controller';

class RelationshipController extends DefaultController<RelationshipManager> {
    constructor(dbName: string) {
        super(new RelationshipManager(dbName));
    }

    async createRelationship(req: Request, res: Response) {
        const relationshipTemplate = fetchPropertyFromRequest<IMongoRelationshipTemplate>(req, 'relationshipTemplate');

        res.json(
            await this.manager.createRelationshipByEntityIds(
                req.body.relationshipInstance,
                relationshipTemplate,
                req.body.ignoredRules,
                req.body.userId,
            ),
        );
    }

    async getRelationshipById(req: Request, res: Response) {
        res.json(await this.manager.getRelationshipById(req.params.id));
    }

    async getRelationshipsCountByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.getRelationshipsCountByTemplateId(req.query.templateId as unknown as string));
    }

    async getRelationshipsByIds(req: Request, res: Response) {
        res.json(await this.manager.getRelationshipsByIds(req.body.ids));
    }

    async deleteRelationshipById(req: Request, res: Response) {
        res.json(await this.manager.deleteRelationshipById(req.params.id, req.body.ignoredRules, req.body.userId));
    }

    async updateRelationshipPropertiesById(req: Request, res: Response) {
        res.json(await this.manager.updateRelationshipPropertiesById(req.params.id, req.body.properties));
    }
}

export default RelationshipController;
