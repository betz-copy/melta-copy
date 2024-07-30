import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../instances/middlewares';
import { IFrameManager } from './manager';

class IFrameController {
    static async searchIFrames(req: Request, res: Response) {
        const { body, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(await IFrameManager.searchIFrames(body, permissionsOfUserId));
    }

    static async getIFrameById(req: Request, res: Response) {
        const {
            params: { iFrameId },
        } = req as RequestWithPermissionsOfUserId;

        res.json(await IFrameManager.getIFrameById(iFrameId));
    }

    static async createIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.createIFrame(req.body));
    }

    static async deleteIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.deleteIFrame(req.params.iFrameId));
    }

    static async updateIFrame(req: Request, res: Response) {
        res.json(await IFrameManager.updateIFrame(req.params.iFrameId, req.body, req.file));
    }
}

export default IFrameController;
