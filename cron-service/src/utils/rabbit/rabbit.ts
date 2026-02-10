import { INotificationMetadata, NotificationType } from '@packages/notification';
import { menash } from 'menashmq';
import config from '../../config';

const {
    rabbit,
    service: { workspaceIdHeaderName },
} = config;

class RabbitManager {
    private workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    async createNotification<NotificationMetadata extends INotificationMetadata>(
        viewers: string[],
        type: NotificationType,
        metadata: NotificationMetadata,
    ) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }

    async runRulesWithTodayFuncQueue() {
        return menash.send(rabbit.runRulesWithTodayFuncQueue, {}, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }
}

export default RabbitManager;
