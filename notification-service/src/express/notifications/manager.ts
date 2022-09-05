import { FilterQuery } from 'mongoose';
import NotificationModel from './model';
import { INotification, INotificationDocument, NotificationType } from './interface';
import { NotificationDoesNotExistError } from '../error';
import transaction from '../../utils/mongoose';

export class NotificationsManager {
    public static async getNotifications(limit: number, step: number, type?: NotificationType, viewerId?: string): Promise<INotification[]> {
        return NotificationModel.find(this.makeQuery(type, viewerId), {}, { limit, skip: step * limit }).lean();
    }

    public static async getNotificationCount(type?: NotificationType, viewerId?: string): Promise<number> {
        return NotificationModel.count(this.makeQuery(type, viewerId));
    }

    public static async getNotificationById(notificationId: string): Promise<INotification> {
        return NotificationModel.findById(notificationId).orFail(new NotificationDoesNotExistError(notificationId)).lean();
    }

    public static async createNotification(notificationData: Omit<INotification, 'createdAt'>): Promise<INotification> {
        return NotificationModel.create(notificationData);
    }

    public static async notificationSeen(notificationId: string, viewerId: string): Promise<INotification> {
        return transaction(async (session) => {
            const notification = await NotificationModel.findByIdAndUpdate(notificationId, { $pull: { viewers: viewerId } }, { new: true, session })
                .orFail(new NotificationDoesNotExistError(notificationId))
                .lean();

            if (!notification.viewers.length) {
                await NotificationModel.findByIdAndDelete(notificationId, { session });
            }

            return notification;
        });
    }

    private static makeQuery(type?: NotificationType, viewerId?: string) {
        const query: FilterQuery<INotificationDocument> = {};

        if (type) query.type = type;
        if (viewerId) query.viewers = viewerId;

        return query;
    }
}

export default NotificationsManager;
