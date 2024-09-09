import { ConsumerMessage } from 'menashmq';
import NotificationsManager from '../express/notifications/manager';
import { basicValidateRequest } from '../utils/joi';
import { notificationSchema } from '../utils/joi/schemas/notification';
import logger from '../utils/logger/logsLogger';
import config from '../config';

const {
    service: { workspaceIdHeaderName },
} = config;

class NotificationsConsumer {
    static async createNotification(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value = basicValidateRequest(notificationSchema, msgContent);

            const manager = new NotificationsManager(msg.properties.headers[workspaceIdHeaderName]);

            await manager.createNotification(value);

            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default NotificationsConsumer;
