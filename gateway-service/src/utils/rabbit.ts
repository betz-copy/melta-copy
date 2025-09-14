import { menash } from 'menashmq';
import { IUser, INotificationMetadata, NotificationType, logger, IRuleIndicatorAlertNotificationMetadata } from '@microservices/shared';
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

    private mailManager: MailManager;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.mailManager = new MailManager(workspaceId);
    }

    async createNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends IMailNotificationMetadataPopulated,
    >(viewers: string[], type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [workspaceIdHeaderName]: this.workspaceId } });

        const filteredViewers: IUser[] = await this.filterViewers(viewers, type);

        if (filteredViewers.length > 0) {
            const mailData =
                type === NotificationType.ruleIndicatorAlert
                    ? await this.mailManager.createIndicatorMail(
                          { viewers: filteredViewers, type, populatedMetaData },
                          (metadata as IRuleIndicatorAlertNotificationMetadata).email,
                      )
                    : await this.mailManager.createMail({ viewers: filteredViewers, type, populatedMetaData });

            console.dir(mailData, { depth: Infinity });
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

    async deleteFiles(minioFileIds: string[]) {
        await menash
            .send(rabbit.deleteDocsSemanticQueue, { minioFileIds }, { headers: { [workspaceIdHeaderName]: this.workspaceId } })
            .catch((err) => {
                logger.error('Failed at deleting file', err);
            });
    }
}

export default RabbitManager;
