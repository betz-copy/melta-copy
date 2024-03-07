import ActivityLogModel from './model';
import { IActivityLog } from './interface';

export class ActivityLogManager {
    static getActivity(entityId: string, limit: number, skip: number, actions?: any[]) {
        if(actions?.length!==0)
           return ActivityLogModel.find({ entityId: entityId, action: { $in: actions } }).limit(limit).skip(skip).exec()
        return ActivityLogModel.find({ entityId: entityId }).limit(limit).skip(skip).exec()
    }

    static async createActivity(activityLog: IActivityLog) {
        try{
            return ActivityLogModel.create(activityLog);
        }
        catch(error: any){
            if(error.name === "MongoError" && (error as any).code === 11000){
                return ActivityLogModel.find().and([ {entityId: activityLog.entityId}, {action: new RegExp(activityLog.action)} ]).limit(1).exec()
                
            }
            else
                throw error;
        }
        
    }
}

export default ActivityLogManager;
