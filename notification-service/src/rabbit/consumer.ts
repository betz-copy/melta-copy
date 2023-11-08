/* eslint-disable no-console */
import { ConsumerMessage } from 'menashmq';
import NotificationsManager from '../express/notifications/manager';
import { basicValidateRequest } from '../utils/joi';
import { notificationSchema } from '../utils/joi/schemas/notification';

class NotificationsConsumer {
    static async createNotification(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value = basicValidateRequest(notificationSchema, msgContent);
        
            await NotificationsManager.createNotification(value);

            msg.ack();
        } catch (err: any) {
            console.log(err);
            msg.nack(false);
        }
    }
}

export default NotificationsConsumer;
