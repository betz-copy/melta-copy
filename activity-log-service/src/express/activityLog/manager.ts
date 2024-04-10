import ActivityLogModel from './model';
import { IActivityLog } from './interface';

export class ActivityLogManager {
    static getActivity(entityId: string, limit: number, skip: number) {
        return ActivityLogModel.find({ entityId }).limit(limit).skip(skip).exec();
    }

    static createActivity(activityLog: IActivityLog) {
        return ActivityLogModel.create(activityLog);
    }

    static deletePropertiesOfTemplate(entityId: string, propertiesToRemove: { properties: string[] }) {
        console.log(entityId, propertiesToRemove);

        const { properties } = propertiesToRemove;
        return ActivityLogModel.updateMany(
            { entityId, action: 'UPDATE_ENTITY' },
            { $pull: { 'metadata.updatedFields': { $elemMatch: { fieldName: { $in: properties } } } } },
        );
    }
}

export default ActivityLogManager;
