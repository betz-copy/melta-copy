import { Request, Response } from 'express';
import { IFrameManager } from './manager';

class IFrameController {
    static async searchIFrames(req: Request, res: Response) {
        res.json(await IFrameManager.searchIFrames(req.body));
    }

    static async getIFrameById(req: Request, res: Response) {
        res.json(await IFrameManager.getIFrameById(req.params.iFrameId));
    }

    static async getAllIFrames(_req: Request, res: Response) {
        res.json(await IFrameManager.getAllIFrames());
    }

    static async createIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.createIFrame(req.body));
    }

    static async deleteIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.deleteIFrame(req.params.iFrameId));
    }

    static async updateIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.updateIFrame(req.params.iFrameId, req.body));
    }
}

export default IFrameController;
