import ActivityLogModel from './model';

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
}

export default ActivityLogManager;
