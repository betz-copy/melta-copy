import { menash } from 'menashmq';
import { INotificationMetadata, NotificationType } from '@microservices/shared';
import config from '../config';
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
