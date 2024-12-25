import { Request, Response } from 'express';
import { IActivityLog, DefaultController } from '@microservices/shared';
import ActivityLogManager from './manager';

export default class ActivityLogController extends DefaultController<IActivityLog, ActivityLogManager> {
    constructor(workspaceId: string) {
        super(new ActivityLogManager(workspaceId));
    }

    async getActivity(req: Request, res: Response) {
        const { limit, skip, actions } = req.query;
        const { entityId } = req.params;

        res.json(await this.manager.getActivity(entityId, Number(limit), Number(skip), actions as string[]));
    }
}
