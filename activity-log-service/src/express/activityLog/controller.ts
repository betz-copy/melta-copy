import { Request, Response } from 'express';
import { ActivityLogManager } from './manager';

class ActivityLogController {
    static async getActivity(req: Request, res: Response) {
        const { limit, skip } = req.query;
        res.json(await ActivityLogManager.getActivity(req.params.entityId, Number(limit), Number(skip)));
    }

    static async createActivity(req: Request, res: Response) {
        res.json(await ActivityLogManager.createActivity(req.body));
    }

    static async deletePropertiesOfTemplate(req: Request, res: Response) {
        res.json(await ActivityLogManager.deletePropertiesOfTemplate(req.params.entityId, req.body));
    }
}

export default ActivityLogController;
