import { menash } from 'menashmq';
import { IUser, INotificationMetadata, NotificationType, logger } from '@microservices/shared';
import config from '../config';
// eslint-disable-next-line import/extensions
import MailManager from './mailNotifications';
import { IMailNotificationMetadataPopulated } from './mailNotifications/interfaces';
import UsersManager from '../express/users/manager';

const {
    rabbit,
    service: { workspaceIdHeaderName },
} = config;

class RabbitManager {
    private workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    async createNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends IMailNotificationMetadataPopulated,
    >(viewers: string[], type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [workspaceIdHeaderName]: this.workspaceId } });

        const filteredViewers: IUser[] = await this.filterViewers(viewers, type);

        if (filteredViewers.length > 0) {
            const mailData = await new MailManager(this.workspaceId).createMail({ viewers: filteredViewers, type, populatedMetaData });
            await menash.send(rabbit.mailNotificationQueue, mailData, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
        }
    }

    async filterViewers(viewersId: string[], type: NotificationType) {
        const viewers: Promise<IUser>[] = viewersId.map(async (viewerId: string) => {
            return UsersManager.getUserById(viewerId);
        });
        const viewersData: IUser[] = await Promise.all(viewers);

        return viewersData.filter((viewer: IUser) => viewer.preferences.mailsNotificationsTypes?.includes(type));
    }

    async indexFiles(templateId: string, entityId: string, minioFileIds: string[]) {
        const fileData = { templateId, entityId, minioFileIds };
        await menash.send(rabbit.insertDocsSemanticQueue, fileData, { headers: { [workspaceIdHeaderName]: this.workspaceId } }).catch((err) => {
            logger.error('Failed at indexing file', err);
        });
    }

    async deleteFiles(templateId: string, entityId: string, minioFileIds: string[]) {
        const fileData = { templateId, entityId, minioFileIds };
        await menash.send(rabbit.deleteDocsSemanticQueue, fileData, { headers: { [workspaceIdHeaderName]: this.workspaceId } }).catch((err) => {
            logger.error('Failed at deleting file', err);
        });
    }
}

export default RabbitManager;
