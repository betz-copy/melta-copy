import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import EmbeddingManager from './manager';

class EmbeddingController extends DefaultController {
    constructor(workspaceId: string) {
        super(new EmbeddingManager(workspaceId));
    }

    async search(req: Request, res: Response) {
        res.json(await this.manager.search(req.body));
    }

    async rerank(req: Request, res: Response) {
        res.json(await this.manager.rerank(req.body));
    }

    async createIndex(_req: Request, res: Response) {
        res.json(await this.manager.createIndex());
    }

    async deleteIndex(_req: Request, res: Response) {
        res.json(await this.manager.deleteIndex());
    }
}

export default EmbeddingController;
