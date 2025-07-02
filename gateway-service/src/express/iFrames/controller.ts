import { Request, Response } from 'express';
import { IFrameManager } from './manager';
import DefaultController from '../../utils/express/controller';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

export class IFrameController extends DefaultController<IFrameManager> {
    constructor(workspaceId: string) {
        super(new IFrameManager(workspaceId));
    }

    async searchIFrames(req: Request, res: Response) {
        const { body, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.searchIFrames(body, permissionsOfUserId));
    }

    async getIFrameById(req: Request, res: Response) {
        const {
            params: { iFrameId },
        } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.getIFrameById(iFrameId));
    }

    async createIFrame(req: Request, res: Response) {
        res.json(await this.manager.createIFrame(req.body, req.file, req.query.toDashboard as boolean | undefined));
    }

    async deleteIFrame(req: Request, res: Response) {
        res.json(await this.manager.deleteIFrame(req.params.iFrameId, req.query.deleteReferenceDashboardItems as boolean | undefined));
    }

    async updateIFrame(req: Request, res: Response) {
        res.json(await this.manager.updateIFrame(req.params.iFrameId, req.body, req.file));
    }
}

export default IFrameController;
