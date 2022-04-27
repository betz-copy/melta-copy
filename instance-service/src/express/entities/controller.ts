import { Request, Response } from 'express';
import { EntityManager } from './manager';

class EntityController {
    static async createEntity(req: Request, res: Response) {
        res.json(await EntityManager.createEntity(req.body));
    }

    static async getEntities(req: Request, res: Response) {
        res.json(await EntityManager.getEntities(req.params.templateId, req.body));
    }

    static async getEntityById(req: Request, res: Response) {
        const { expanded } = req.query;

        res.json(expanded ? await EntityManager.getExpandedEntityById(req.params.id) : await EntityManager.getEntityById(req.params.id));
    }

    static async deleteEntityById(req: Request, res: Response) {
        const { deleteAllRelationships } = req.query;

        res.json(await EntityManager.deleteEntityById(req.params.id, deleteAllRelationships as unknown as boolean));
    }

    static async deleteEntitiesByTemplateId(req: Request, res: Response) {
        res.json(await EntityManager.deleteByTemplateId(req.query.templateId as unknown as string));
    }

    static async updateEntityById(req: Request, res: Response) {
        res.json(await EntityManager.updateEntityById(req.params.id, req.body.properties));
    }
}

export default EntityController;
