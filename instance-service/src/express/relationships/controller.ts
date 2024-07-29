import { Request, Response } from 'express';
import { fetchPropertyFromRequest } from '../../utils/express';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { RelationshipManager } from './manager';

class RelationshipController {
    static async createRelationship(req: Request, res: Response) {
        const relationshipTemplate = fetchPropertyFromRequest<IMongoRelationshipTemplate>(req, 'relationshipTemplate');

        res.json(
            await RelationshipManager.createRelationshipByEntityIds(
                req.body.relationshipInstance,
                relationshipTemplate,
                req.body.ignoredRules,
                req.body.userId,
            ),
        );
    }

    static async getRelationshipById(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipById(req.params.id));
    }

    static async getRelationshipsCountByTemplateId(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipsCountByTemplateId(req.query.templateId as unknown as string));
    }

    static async getRelationshipsByIds(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipsByIds(req.body.ids));
    }

    static async deleteRelationshipById(req: Request, res: Response) {
        res.json(await RelationshipManager.deleteRelationshipById(req.params.id, req.body.ignoredRules, req.body.userId));
    }

    static async updateRelationshipPropertiesById(req: Request, res: Response) {
        res.json(await RelationshipManager.updateRelationshipPropertiesById(req.params.id, req.body.properties));
    }

    static async runBulkOfActionsInMultipleTransactions(req: Request, res: Response) {
        res.json(
            await RelationshipManager.runBulkOfActionsInMultipleTransactions(
                req.body.actionsGroups,
                req.body.ignoredRules,
                req.query.dryRun as unknown as boolean,
                req.body.userId,
            ),
        );
    }
}

export default RelationshipController;
