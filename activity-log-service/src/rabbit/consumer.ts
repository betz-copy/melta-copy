import { ConsumerMessage } from 'menashmq';

import { ActivityLogManager } from '../express/activityLog/manager';
import activityLogSchema from '../utils/rabbit/joi.schema';
import { basicValidateRequest } from '../utils/joi';
import { IActivityLog } from '../express/activityLog/interface';
import { ServiceError } from '../express/error';

class ActivityLogConsumer {
    static async createActivityLog(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value: IActivityLog = basicValidateRequest(activityLogSchema, msgContent);

            await ActivityLogManager.createActivity(value);

            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(500, `Rabbit consumer error`, { error: err })
        }
    }
}

export default ActivityLogConsumer;
