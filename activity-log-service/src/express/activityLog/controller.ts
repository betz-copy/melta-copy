import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { IActivityLog } from './interface';
import ActivityLogManager from './manager';

export default class ActivityLogController extends DefaultController<IActivityLog, ActivityLogManager> {
    constructor(workspaceId: string) {
        super(new ActivityLogManager(workspaceId));
    }

    async getActivity(req: Request, res: Response) {
        const { limit, skip, actions } = req.query;
        res.json(await this.manager.getActivity(req.params.entityId, Number(limit), Number(skip), actions as string[]));
    }
}
