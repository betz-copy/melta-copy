import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { IActivityLog } from './interface';
import { ActivityLogSchema } from './model';

export default class ActivityLogManager extends DefaultManagerMongo<IActivityLog> {
    constructor(dbName: string) {
        super(dbName, config.mongo.activitiesCollectionName, ActivityLogSchema);
    }

    async getActivity(entityId: string, limit: number, skip: number, actions?: string[]) {
        const regActions = actions?.map((action) => new RegExp(action));
        if (actions) {
            const res = this.model
                .find({ entityId, action: { $in: regActions } })
                .limit(limit)
                .skip(skip)
                .exec();
            return res;
        }
        return this.model.find({ entityId }).limit(limit).skip(skip).exec();
    }

    async createActivity(activityLog: IActivityLog) {
        let createValue;
        try {
            createValue = await this.model.create(activityLog);
        } catch (error: any) {
            if (error.name === 'MongoError' && (error as any).code === 11000) {
                return this.model.findOne({ entityId: activityLog.entityId, action: new RegExp(activityLog.action) });
            }
            throw error;
        }
        return createValue;
    }
}
