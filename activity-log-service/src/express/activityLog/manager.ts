import ActivityLogModel from './model';
import { IActivityLog } from './interface';

export class ActivityLogManager {
    static getActivity(entityId: string, limit: number, skip: number) {
        return ActivityLogModel.find({ entityId }).limit(limit).skip(skip).exec();
    }

    static createActivity(activityLog: IActivityLog) {
        return ActivityLogModel.create(activityLog);
    }
}

export default ActivityLogManager;
