import { ConsumerMessage } from 'menashmq';

import { StatusCodes } from 'http-status-codes';
import { IActivityLog } from '../express/activityLog/interface';
import ActivityLogManager from '../express/activityLog/manager';
import { basicValidateRequest } from '../utils/joi';
import { ServiceError } from '../express/error';
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
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, `Rabbit consumer error`, { error: err });
        }
    }
}

export default ActivityLogConsumer;
