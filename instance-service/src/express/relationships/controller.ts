import { Request, Response } from 'express';
import { IMongoRelationshipTemplate, fetchPropertyFromRequest } from '@microservices/shared';
import RelationshipManager from './manager';
import DefaultController from '../../utils/express/controller';

class RelationshipController extends DefaultController<RelationshipManager> {
    constructor(workspaceId: string) {
        super(new RelationshipManager(workspaceId));
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
        res.json(await this.manager.getRelationshipsCountByTemplateId(req.query.templateId as string));
    }

    async getRelationshipsByEntitiesAndTemplate(req: Request, res: Response) {
        const { sourceEntityId, destinationEntityId, templateId } = req.query;
        res.json(
            await this.manager.getRelationshipsByEntitiesAndTemplate(sourceEntityId as string, destinationEntityId as string, templateId as string),
        );
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
