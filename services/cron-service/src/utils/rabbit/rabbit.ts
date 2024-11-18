import { menash } from 'menashmq';
import { INotificationMetadata, NotificationType } from '@microservices/shared';
import config from '../../config';

const {
    rabbit,
    service: { workspaceIdHeaderName },
} = config;

export class RabbitManager {
    constructor(private workspaceId: string) {}

    async createNotification<NotificationMetadata extends INotificationMetadata>(
        viewers: string[],
        type: NotificationType,
        metadata: NotificationMetadata,
    ) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }
}
