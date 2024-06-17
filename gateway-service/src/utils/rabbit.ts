import { menash } from 'menashmq';
import config from '../config';
import { INotificationMetadata, NotificationType } from '../externalServices/notificationService/interfaces';
import { IMailNotificationMetadataPopulated } from './mailNotifications/interfaces';

const {
    rabbit,
    service: { dbHeaderName },
} = config;

export class RabbitManager {
    dbName: string;

    constructor(dbName) {
        this.dbName = dbName;
    }

    async createNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends IMailNotificationMetadataPopulated,
    >(viewers: string[], type: NotificationType, metadata: NotificationMetadata, _populatedMetaData: NotificationMetadataPopulated) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [dbHeaderName]: this.dbName } });

        // TODO-WORKSPACES: support mail notifications
        // const mailData = await createMail({ viewers, type, populatedMetaData });
        // await menash.send(rabbit.mailNotificationQueue, mailData);
    }
}
