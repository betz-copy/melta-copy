import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import SemanticManager from './manager';

class SemanticController extends DefaultController<SemanticManager> {
    constructor(workspaceId: string) {
        super(new SemanticManager(workspaceId));
    }

    async search(_req: Request, res: Response) {
        res.json(await this.manager.search(limit, step, query));
    }

    async createIndex(_req: Request, res: Response) {
        res.json(await this.manager.createIndex());
    }

    async deleteIndex(_req: Request, res: Response) {
        res.json(await this.manager.deleteIndex());
    }

    async initIndex(_req: Request, res: Response) {
        res.json(await this.manager.initIndex());
    }
}

export default SemanticController;
