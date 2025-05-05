import { ConsumerMessage } from 'menashmq';

import { ServiceError, IActivityLog, basicValidateRequest } from '@microservices/shared';
import ActivityLogManager from '../express/activityLog/manager';
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
            msg.nack(false);
            throw new ServiceError(undefined, `Rabbit consumer error`, { error: err });
        }
    }
}

export default ActivityLogConsumer;
