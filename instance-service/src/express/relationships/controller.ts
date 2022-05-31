import { Request, Response } from 'express';
import { RelationshipManager } from './manager';

class RelationshipController {
    static async createRelationship(req: Request, res: Response) {
        res.json(await RelationshipManager.createRelationshipByEntityIds(req.body));
    }

    static async getRelationshipById(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipById(req.params.id));
    }

    static async getRelationshipsCountByTemplateId(req: Request, res: Response) {
        res.json(await RelationshipManager.getRelationshipsCountByTemplateId(req.query.templateId as unknown as string));
    }

    static async deleteRelationshipById(req: Request, res: Response) {
        res.json(await RelationshipManager.deleteRelationshipById(req.params.id));
    }

    static async updateRelationshipPropertiesById(req: Request, res: Response) {
        res.json(await RelationshipManager.updateRelationshipPropertiesById(req.params.id, req.body.properties));
    }
}

export default RelationshipController;
