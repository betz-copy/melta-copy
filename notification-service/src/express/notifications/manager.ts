import {
    DefaultManagerMongo,
    IBasicNotificationQuery,
    IDateAboutToExpireNotificationMetadata,
    INotification,
    INotificationCountGroups,
    INotificationGroupCountDetails,
} from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { transaction, UPDATE_CREATED_AT } from '../../utils/mongo';
import { NotificationDoesNotExistError } from '../error';
import NotificationsSchema from './model';

export class NotificationsManager extends DefaultManagerMongo<INotification> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.notificationsCollectionName, NotificationsSchema);
    }

    public async getNotifications(limit: number, step: number, query: IBasicNotificationQuery): Promise<INotification[]> {
        if (query.types && query.types.length > 0)
            return this.model.aggregate([
                { $match: this.handleQuery(query) },
                { $skip: step * limit },
                { $limit: limit },
                ...UPDATE_CREATED_AT,
                { $sort: { createdAt: -1 } },
            ]);
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
        const notification = (await this.model.aggregate([{ $match: { _id: notificationId } }, ...UPDATE_CREATED_AT]))[0];

        if (!notification) throw new NotificationDoesNotExistError(notificationId);
        return notification;
    }

    public async createNotification(notificationData: Omit<INotification, 'createdAt'>): Promise<INotification> {
        // To avoid spam of dateAboutToExpire notifications, update the current notification document.
        if (notificationData.type === 'dateAboutToExpire') {
            return this.model.findOneAndUpdate(
                {
                    $and: [
                        {
                            // datePropertyValue only exists on IDateAboutToExpireMetadata.
                            'metadata.datePropertyValue': (notificationData?.metadata as IDateAboutToExpireNotificationMetadata)?.datePropertyValue,
                            type: notificationData.type,
                            'metadata.entityId': (notificationData?.metadata as IDateAboutToExpireNotificationMetadata)?.entityId,
                        },
                    ],
                },
                // NotificationDate is being used instead of createdAt because we are updating the existing document.
                { ...notificationData, notificationDate: new Date() },
                { new: true, upsert: true },
            );
        }

        return this.model.create({ ...notificationData, notificationDate: new Date() });
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
            await this.model.updateMany(updatedQuery, { $pull: { viewers: viewerId } }, { session });
            const notification = await this.model.find(updatedQuery, {}, { new: true, session }).lean();

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
