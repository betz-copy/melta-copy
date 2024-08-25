import { ConsumerMessage } from 'menashmq';

import { IActivityLog } from '../express/activityLog/interface';
import ActivityLogManager from '../express/activityLog/manager';
import { basicValidateRequest } from '../utils/joi';
import logger from '../utils/logger/logsLogger';
import activityLogSchema from '../utils/rabbit/joi.schema';
import config from '../config';

const {
    service: { workspaceIdHeaderName },
} = config;

class ActivityLogConsumer {
    static async createActivityLog(msg: ConsumerMessage) {
        const manager = new ActivityLogManager(msg.properties.headers[workspaceIdHeaderName]);
        const msgContent = msg.getContent();

        try {
            const value: IActivityLog = basicValidateRequest(activityLogSchema, msgContent);

            await manager.createActivity(value);

            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default ActivityLogConsumer;
