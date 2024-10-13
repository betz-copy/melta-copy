import { menash } from 'menashmq';
import config from '../config';
import { INotificationMetadata, NotificationType } from '../externalServices/notificationService/interfaces';
import { MailManager } from './mailNotifications';
import { IMailNotificationMetadataPopulated } from './mailNotifications/interfaces';
import logger from './logger/logsLogger';

const {
    rabbit,
    service: { workspaceIdHeaderName },
} = config;

export class RabbitManager {
    constructor(private workspaceId: string) {}

    async createNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends IMailNotificationMetadataPopulated,
    >(viewers: string[], type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [workspaceIdHeaderName]: this.workspaceId } });

        const mailData = await new MailManager(this.workspaceId).createMail({ viewers, type, populatedMetaData });

        await menash.send(rabbit.mailNotificationQueue, mailData, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }

    indexFile(templateId: string, entityId: string, minioFileIds: string[]) {
        const fileData = { template_id: templateId, entity_id: entityId, minio_file_ids: minioFileIds };
        menash.send(rabbit.sematicSearchQueue, fileData, { headers: { [workspaceIdHeaderName]: this.workspaceId } }).catch((err) => {
            logger.error('Failed at indexing file', err);
        });
    }
}
