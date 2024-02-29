import ActivityLogModel from './model';
import { IActivityLog } from './interface';

export class ActivityLogManager {
    static async getActivity(entityId: string, limit: number, skip: number, action?: any) {
        return ActivityLogModel.find({ entityId: entityId, action:action }).limit(limit).skip(skip).exec()
    }

    static createActivity(activityLog: IActivityLog) {
        return ActivityLogModel.create(activityLog);
    }
}

export default ActivityLogManager;
