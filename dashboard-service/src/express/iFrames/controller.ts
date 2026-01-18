import { IMongoIframe } from '@packages/iframe';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import IFrameManager from './manager';

class IFrameController extends DefaultController<IMongoIframe, IFrameManager> {
    constructor(workspaceId: string) {
        super(new IFrameManager(workspaceId));
    }

    async searchIFrames(req: Request, res: Response) {
        const { search, limit, skip, ids } = req.body;

        res.json(await this.manager.searchIFrames({ search, limit, skip, ids }));
    }

    async getIFrameById(req: Request, res: Response) {
        res.json(await this.manager.getIFrameById(req.params.iFrameId as string));
    }

    async createIFrame(req: Request, res: Response) {
        res.json(await this.manager.createIFrame(req.body));
    }

    async deleteIFrame(req: Request, res: Response) {
        res.json(await this.manager.deleteIFrame(req.params.iFrameId as string));
    }

    async updateIFrame(req: Request, res: Response) {
        res.json(await this.manager.updateIFrame(req.params.iFrameId as string, req.body));
    }
}

export default IFrameController;
