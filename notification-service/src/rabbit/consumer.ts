import { basicValidateRequest, logger } from '@packages/utils';
import { ConsumerMessage } from 'menashmq';
import config from '../config';
import NotificationsManager from '../express/notifications/manager';
import { notificationSchema } from '../utils/joi/schemas/notification';

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
            msg.nack(false);
            logger.error('Rabbit consumer error', { error: err });
        }
    }
}

export default NotificationsConsumer;
