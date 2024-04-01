import ActivityLogModel from './model';
import { IActivityLog } from './interface';

export class ActivityLogManager {
    static async getActivity(entityId: string, limit: number, skip: number, actions?: string[]) {
        const regActions = actions?.map((action) => new RegExp(action));
        if (actions) {
            const res = ActivityLogModel.find({ entityId, action: { $in: regActions } })
                .limit(limit)
                .skip(skip)
                .exec();
            return res;
        }
        return ActivityLogModel.find({ entityId }).limit(limit).skip(skip).exec();
    }

    static async createActivity(activityLog: IActivityLog) {
        let createValue;
        try {
            createValue = await ActivityLogModel.create(activityLog);
        } catch (error: any) {
            if (error.name === 'MongoError' && (error as any).code === 11000) {
                return ActivityLogModel.findOne({ entityId: activityLog.entityId, action: new RegExp(activityLog.action) });
            }
            throw error;
        }
        return createValue;
    }
}

export default ActivityLogManager;
