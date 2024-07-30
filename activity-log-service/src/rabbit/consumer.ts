import { ConsumerMessage } from 'menashmq';

import { ActivityLogManager } from '../express/activityLog/manager';
import activityLogSchema from '../utils/rabbit/joi.schema';
import { basicValidateRequest } from '../utils/joi';
import logger from '../utils/logger/logsLogger';
import { IActivityLog } from '../express/activityLog/interface';

class ActivityLogConsumer {
    static async createActivityLog(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value: IActivityLog = basicValidateRequest(activityLogSchema, msgContent);

            await ActivityLogManager.createActivity(value);

            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default ActivityLogConsumer;
