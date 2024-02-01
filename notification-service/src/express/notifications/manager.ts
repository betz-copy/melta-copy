import { FilterQuery } from 'mongoose';
import DefaultManager from '../../utils/express/manager';
import transaction from '../../utils/mongoose';
import { NotificationDoesNotExistError } from '../error';
import { IBasicNotificationQuery, INotification, INotificationCountGroups, INotificationGroupCountDetails } from './interface';
import NotificationModel from './model';

export class NotificationsManager extends DefaultManager<INotification> {
    constructor(dbName: string) {
        super(dbName, NotificationModel);
    }

    public async getNotifications(limit: number, step: number, query: IBasicNotificationQuery): Promise<INotification[]> {
        return this.model
            .find(this.handleQuery(query), {}, { limit, skip: step * limit })
            .sort({ createdAt: -1 })
            .lean();
    }

    public async getNotificationCount(query: IBasicNotificationQuery) {
        return this.model.count(this.handleQuery(query));
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

    // eslint-disable-next-line class-methods-use-this
    private handleQuery({ viewerId, types, startDate, endDate, ...rest }: IBasicNotificationQuery) {
        const query: FilterQuery<INotification> = { ...rest };

        if (types) query.type = { $in: types };
        if (viewerId) query.viewers = viewerId;
        if (startDate && endDate) {
            query.createdAt = { $gte: startDate, $lte: endDate };
        }
        return query;
    }
}

export default NotificationsManager;
