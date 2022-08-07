import { Request, Response } from 'express';
import { EntityManager } from './manager';

class EntityController {
    static async createEntity(req: Request, res: Response) {
        res.json(await EntityManager.createEntity(req.body));
    }

    static async getEntities(req: Request, res: Response) {
        res.json(await EntityManager.getEntities(req.query.templateId as string, req.body));
    }

    static async getEntityById(req: Request, res: Response) {
        res.json(await EntityManager.getEntityById(req.params.id));
    }

    static async getExpandedEntityById(req: Request, res: Response) {
        const { disabled, numberOfConnections, templateIds } = req.body;

        res.json(await EntityManager.getExpandedEntityById(req.params.id, disabled as unknown as boolean, templateIds, numberOfConnections));
    }

    static async deleteEntityById(req: Request, res: Response) {
        res.json(await EntityManager.deleteEntityById(req.params.id, req.query.deleteAllRelationships as unknown as boolean));
    }

    static async deleteEntitiesByTemplateId(req: Request, res: Response) {
        res.json(await EntityManager.deleteByTemplateId(req.query.templateId as unknown as string));
    }

    static async updateStatusById(req: Request, res: Response) {
        res.json(await EntityManager.updateStatusById(req.params.id, req.body.disabled));
    }

    static async updateEntityById(req: Request, res: Response) {
        res.json(await EntityManager.updateEntityById(req.params.id, req.body.properties));
    }
}

export default EntityController;
