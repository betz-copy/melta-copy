import { FilterQuery } from 'mongoose';
import NotificationModel from './model';
import { INotification, INotificationDocument } from './interface';
import { NotificationDoesNotExistError } from '../error';

export class NotificationsManager {
    public static async getNotifications(limit: number, step: number, type?: string, viewerId?: string): Promise<INotificationDocument[]> {
        const skip = step * limit;

        const query: FilterQuery<INotificationDocument> = {};
        if (type) query.type = type;
        if (viewerId) query.viewers = viewerId;

        return NotificationModel.find(query, {}, { limit, skip }).lean();
    }

    public static async getNotificationById(notificationId: string): Promise<INotificationDocument> {
        return NotificationModel.findById(notificationId).orFail(new NotificationDoesNotExistError(notificationId)).lean();
    }

    public static async createNotification(notificationData: Omit<INotification, 'createdAt'>): Promise<INotificationDocument> {
        return NotificationModel.create(notificationData);
    }

    public static async notificationSeen(notificationId: string, viewerId: string): Promise<INotificationDocument> {
        return NotificationModel.findByIdAndUpdate(notificationId, { $pull: { viewers: viewerId } }, { new: true })
            .orFail(new NotificationDoesNotExistError(notificationId))
            .lean();
    }
}

export default NotificationsManager;
