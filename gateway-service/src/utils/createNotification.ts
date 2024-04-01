import { menash } from 'menashmq';
import config from '../config';
// eslint-disable-next-line import/extensions
import { createMail } from './mailNotifications';
import { INotificationMetadata, NotificationType } from '../externalServices/notificationService/interfaces';
import { IMailNotificationMetadataPopulated } from './mailNotifications/interfaces';

const { rabbit } = config;

async function rabbitCreateNotification<
    NotificationMetadata extends INotificationMetadata,
    NotificationMetadataPopulated extends IMailNotificationMetadataPopulated,
>(viewers: string[], type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated) {
    if (!viewers.length) return;
    await menash.send(rabbit.notificationQueue, { viewers, type, metadata });
    const mailData = await createMail({ viewers, type, populatedMetaData });
    await menash.send(rabbit.mailNotificationQueue, mailData);
}

export { rabbitCreateNotification };
