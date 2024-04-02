import { ConsumerMessage } from 'menashmq';
import NotificationsManager from '../express/notifications/manager';
import { basicValidateRequest } from '../utils/joi';
import { notificationSchema } from '../utils/joi/schemas/notification';
import logger from '../utils/logger';

class NotificationsConsumer {
    static async createNotification(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value = basicValidateRequest(notificationSchema, msgContent);

            await NotificationsManager.createNotification(value);

            msg.ack();
        } catch (err: any) {
            logger.error(err);
            msg.nack(false);
        }
    }
}

export default NotificationsConsumer;
