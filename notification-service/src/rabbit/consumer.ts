/* eslint-disable no-console */
import { ConsumerMessage } from 'menashmq';
import NotificationsManager from '../express/notifications/manager';
import { basicValidateRequest } from '../utils/joi';
import { createNotificationMessageSchema } from './validator.schema';

class NotificationsConsumer {
    static async createNotification(msg: ConsumerMessage) {
        try {
            const msgContent = JSON.parse(String(msg.getContent()));
            const value = basicValidateRequest(createNotificationMessageSchema, msgContent);

            await NotificationsManager.createNotification(value);

            msg.ack();
        } catch (err: any) {
            console.log(err);
            msg.nack(false);
        }
    }
}

export default NotificationsConsumer;
