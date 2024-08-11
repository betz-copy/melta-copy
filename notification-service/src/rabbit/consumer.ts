import { ConsumerMessage } from 'menashmq';
import NotificationsManager from '../express/notifications/manager';
import { basicValidateRequest } from '../utils/joi';
import { notificationSchema } from '../utils/joi/schemas/notification';
import { ServiceError } from '../express/error';
import { StatusCodes } from 'http-status-codes';

class NotificationsConsumer {
    static async createNotification(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value = basicValidateRequest(notificationSchema, msgContent);

            await NotificationsManager.createNotification(value);

            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Rabbit consumer error', { error: err });
        }
    }
}

export default NotificationsConsumer;
