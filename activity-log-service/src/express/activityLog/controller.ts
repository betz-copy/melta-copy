import { IActivityLog } from '@packages/activity-log';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import ActivityLogManager from './manager';

export default class ActivityLogController extends DefaultController<IActivityLog, ActivityLogManager> {
    constructor(workspaceId: string) {
        super(new ActivityLogManager(workspaceId));
    }

    async getActivity(req: Request, res: Response) {
        const { limit, skip, actions, searchText, fieldsSearch, usersSearch, startDateRange, endDateRange } = req.query;
        const { entityId } = req.params;

        res.json(
            await this.manager.getActivity(
                entityId as string,
                Number(limit),
                Number(skip),
                fieldsSearch as string[],
                usersSearch as string[],
                actions as string[],
                searchText as string | undefined,
                startDateRange as Date | undefined,
                endDateRange as Date | undefined,
            ),
        );
    }
}
