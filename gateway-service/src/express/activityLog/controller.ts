import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import ActivityLogManager from './manager';

class ActivityLogController extends DefaultController<ActivityLogManager> {
    constructor(workspaceId: string) {
        super(new ActivityLogManager(workspaceId));
    }

    async getActivity(req: Request, res: Response) {
        res.json(await this.manager.getActivity(req.params.entityId as string, req.query));
    }
}

export default ActivityLogController;
