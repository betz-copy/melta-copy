import ActivityLogModel from './model';
import { IActivityLog } from './interface';

export class ActivityLogManager {
    static getActivity(params: { entityId: string }, query: { limit: number; skip: number }) {
        return ActivityLogModel.find(params).limit(query.limit).skip(query.skip).exec();
    }

    static createActivity(activityLog: IActivityLog) {
        return ActivityLogModel.create(activityLog);
    }
}

export default ActivityLogManager;
