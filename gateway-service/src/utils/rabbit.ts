import { menash } from 'menashmq';
import config from '../config';
import { INotificationMetadata, NotificationType } from '../externalServices/notificationService/interfaces';
import { MailManager } from './mailNotifications';
import { IMailNotificationMetadataPopulated } from './mailNotifications/interfaces';

const {
    rabbit,
    service: { dbHeaderName },
} = config;

export class RabbitManager {
    constructor(private workspaceId: string) {}

    async createNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends IMailNotificationMetadataPopulated,
    >(viewers: string[], type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [dbHeaderName]: this.workspaceId } });

        const mailData = await new MailManager(this.workspaceId).createMail({ viewers, type, populatedMetaData });

        await menash.send(rabbit.mailNotificationQueue, mailData);
    }
}
