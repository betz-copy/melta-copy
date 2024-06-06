import { Request, Response } from 'express';
import { IFrameManager } from './manager';

class IFrameController {
    static async searchIFrames(req: Request, res: Response) {
        res.json(await IFrameManager.searchIFrames(req.body));
    }

    static async getIFrameById(req: Request, res: Response) {
        res.json(await IFrameManager.getIFrameById(req.params.iframeId));
    }

    static async getAllIFrames(_req: Request, res: Response) {
        res.json(await IFrameManager.getAllIFrames());
    }

    static async createIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.createIFrame(req.body));
    }

    static async deleteIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.deleteIFrame(req.params.iframeId));
    }

    static async updateIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.updateIFrame(req.params.iframeId, req.body));
    }
}

export default IFrameController;
