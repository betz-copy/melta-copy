import DefaultManager from '../../utils/express/manager';
import { IActivityLog } from './interface';
import ActivityLogModel from './model';

export default class ActivityLogManager extends DefaultManager<IActivityLog> {
    constructor(dbName: string) {
        super(dbName, ActivityLogModel);
    }

    async getActivity(entityId: string, limit: number, skip: number) {
        return this.model.find({ entityId }).limit(limit).skip(skip).exec();
    }

    async createActivity(activityLog: IActivityLog) {
        return this.model.create(activityLog);
    }
}
