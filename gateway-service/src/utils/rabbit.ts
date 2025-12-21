
import { INotificationMetadata, IRuleIndicatorAlertNotificationMetadata, NotificationType } from '@packages/notification';
import { IKartoffelUser, IUser } from '@packages/user';
import { logger } from '@packages/utils';
import { menash } from 'menashmq';
import config from '../config';
import UsersManager from '../express/users/manager';
// eslint-disable-next-line import/extensions
import MailManager from './mailNotifications';
import { IMailNotificationMetadataPopulated } from './mailNotifications/interfaces';

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
    >(
        viewers: string[],
        type: NotificationType,
        metadata: NotificationMetadata,
        populatedMetaData: NotificationMetadataPopulated,
        externalViewers?: IKartoffelUser[],
    ) {
        if (!viewers.length) return;

        await menash.send(rabbit.notificationQueue, { viewers, type, metadata }, { headers: { [workspaceIdHeaderName]: this.workspaceId } });

        const filteredViewers: IUser[] = await this.filterViewers(viewers, type);

        const viewersMail = [...filteredViewers.map((user) => user.mail)];
        if (externalViewers) {
            const externalViewersMails = externalViewers.map((user) => user.mail).filter((mail) => typeof mail === 'string');
            viewersMail.push(...externalViewersMails);
        }

        if (viewersMail) {
            const mailData = await this.mailManager.createMail(
                { viewersMail, type, populatedMetaData },
                type === NotificationType.ruleIndicatorAlert ? (metadata as IRuleIndicatorAlertNotificationMetadata).email : undefined,
            );

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
