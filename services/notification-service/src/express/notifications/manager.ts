import { FilterQuery } from 'mongoose';
import {
    DefaultManagerMongo,
    IBasicNotificationQuery,
    INotification,
    INotificationCountGroups,
    INotificationGroupCountDetails,
} from '@microservices/shared';
import config from '../../config';
import transaction from '../../utils/mongo';
import { NotificationDoesNotExistError } from '../error';
import NotificationsSchema from './model';

export class NotificationsManager extends DefaultManagerMongo<INotification> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.notificationsCollectionName, NotificationsSchema);
    }

    public async getNotifications(limit: number, step: number, query: IBasicNotificationQuery): Promise<INotification[]> {
        if (query.types && query.types.length > 0)
            return this.model
                .find(this.handleQuery(query), {}, { limit, skip: step * limit })
                .sort({ createdAt: -1 })
                .lean();
        return [];
    }

    public async getNotificationCount(query: IBasicNotificationQuery) {
        return this.model.countDocuments(this.handleQuery(query));
    }

    public async getNotificationGroupCount(
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

    public async getNotificationById(notificationId: string): Promise<INotification> {
        return this.model.findById(notificationId).orFail(new NotificationDoesNotExistError(notificationId)).lean();
    }

    public async createNotification(notificationData: Omit<INotification, 'createdAt'>): Promise<INotification> {
        return this.model.create({ ...notificationData });
    }

    public async notificationSeen(notificationId: string, viewerId: string): Promise<INotification> {
        return transaction(async (session) => {
            const notification = await this.model
                .findByIdAndUpdate(notificationId, { $pull: { viewers: viewerId } }, { new: true, session })
                .orFail(new NotificationDoesNotExistError(notificationId))
                .lean();

            if (!notification.viewers.length) {
                await this.model.findByIdAndDelete(notificationId, { session });
            }

            return notification;
        });
    }

    public async manyNotificationSeen(viewerId: string, query: Omit<IBasicNotificationQuery, 'viewerId'>): Promise<INotification[]> {
        const updatedQuery = this.handleQuery(query);

        return transaction(async (session) => {
            await this.model.updateMany(updatedQuery, { $pull: { viewers: viewerId } }, { new: true, session });
            const notification = await this.model.find(updatedQuery, {}, { session }).lean();

            await this.model.deleteMany({ viewers: { $size: 0 } }, { session });

            return notification;
        });
    }

    private handleQuery({ viewerId, types, startDate, endDate, ...rest }: IBasicNotificationQuery) {
        const query: FilterQuery<INotification> = { ...rest };

        if (viewerId) query.viewers = viewerId;

        if (types) query.type = { $in: types };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;

            if (endDate) query.createdAt.$lte = new Date(endDate.setUTCHours(23, 59, 59, 999));
        }

        return query;
    }
}

export default NotificationsManager;
