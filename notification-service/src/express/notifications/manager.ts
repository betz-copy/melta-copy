import { FilterQuery } from 'mongoose';
import NotificationModel from './model';
import { IBasicNotificationQuery, INotification, INotificationGroupCountDetails, INotificationCountGroups, INotificationDocument } from './interface';
import { NotificationDoesNotExistError } from '../error';
import transaction from '../../utils/mongoose';

export class NotificationsManager {
    public static async getNotifications(limit: number, step: number, query: IBasicNotificationQuery): Promise<INotification[]> {
        return NotificationModel.find(this.handleQuery(query), {}, { limit, skip: step * limit })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getNotificationCount(query: IBasicNotificationQuery) {
        return NotificationModel.count(this.handleQuery(query));
    }

    public static async getNotificationGroupCount(
        groups: INotificationCountGroups,
        query: Omit<IBasicNotificationQuery, 'types'>,
    ): Promise<INotificationGroupCountDetails> {
        const notificationCountDetails: INotificationGroupCountDetails = { total: 0, groups: {} };

        const [totalCount] = await Promise.all([
            this.getNotificationCount(query),

            ...Object.keys(groups).map(async (group) => {
                notificationCountDetails.groups[group] = await this.getNotificationCount({ ...query, types: groups[group] });
            }),
        ]);

        notificationCountDetails.total = totalCount;

        return notificationCountDetails;
    }

    public static async getNotificationById(notificationId: string): Promise<INotification> {
        return NotificationModel.findById(notificationId).orFail(new NotificationDoesNotExistError(notificationId)).lean();
    }

    public static async createNotification(notificationsMoreData: Omit<INotification, 'createdAt'>): Promise<INotification> {
        return NotificationModel.create({ ...notificationsMoreData });
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

    public static async manyNotificationSeen(viewerId: string, query: Omit<IBasicNotificationQuery, 'viewerId'>): Promise<INotification[]> {
        const updatedQuery = this.handleQuery(query);

        return transaction(async (session) => {
            await NotificationModel.updateMany(updatedQuery, { $pull: { viewers: viewerId } }, { new: true, session });
            const notification = await NotificationModel.find(updatedQuery, {}, { session }).lean();

            await NotificationModel.deleteMany({ viewers: { $size: 0 } }, { session });

            return notification;
        });
    }

    private static handleQuery({ viewerId, types, startDate, endDate, ...rest }: IBasicNotificationQuery) {
        const query: FilterQuery<INotificationDocument> = { ...rest };

        query.type = { $in: types };
        if (viewerId) query.viewers = viewerId;
        if (startDate) {
            if (endDate) query.createdAt = { $gte: startDate, $lte: endDate };
            else query.createdAt = { $gte: startDate };
        }

        return query;
    }
}

export default NotificationsManager;
