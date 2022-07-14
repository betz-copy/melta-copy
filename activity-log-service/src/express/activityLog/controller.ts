import { Request, Response } from 'express';
import { ActivityLogManager } from './manager';

class ActivityLogController {
    static async getActivity(req: Request, res: Response) {
        res.json(
            await ActivityLogManager.getActivity(
                req.params as unknown as { entityId: string },
                req.query as unknown as { limit: number; skip: number },
            ),
        );
    }

    static async createActivity(req: Request, res: Response) {
        res.json(await ActivityLogManager.createActivity(req.body));
    }
}

export default ActivityLogController;
