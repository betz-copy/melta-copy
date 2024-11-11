import { ConsumerMessage } from 'menashmq';
import NotificationsManager from '../express/notifications/manager';
import { basicValidateRequest } from '../utils/joi';
import { notificationSchema } from '../utils/joi/schemas/notification';
import { ServiceError } from '../express/error';
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
            msg.nack(false);
            throw new ServiceError(undefined, 'Rabbit consumer error', { error: err });
        }
    }
}

export default NotificationsConsumer;
