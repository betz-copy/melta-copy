import { Request, Response } from 'express';
import { ActivityLogManager } from './manager';

class ActivityLogController {
    static async getActivity(req: Request, res: Response) {
        const { limit, skip, actions } = req.query;
        res.json(await ActivityLogManager.getActivity(req.params.entityId, Number(limit), Number(skip), actions as string[]));
    }
}

export default ActivityLogController;
