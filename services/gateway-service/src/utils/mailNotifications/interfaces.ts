import { IMongoStepTemplate, IMongoProcessInstancePopulated, NotificationType } from '@microservices/shared';
import {
    INotificationMetadataPopulated,
    IProcessReviewerUpdateNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';

export interface IProcessReviewerUpdateMailNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated;
    addedSteps: (IMongoStepTemplate | null)[];
    deletedSteps: (IMongoStepTemplate | null)[];
    unchangedStepIds: (string | null)[];
}

export interface IProcessStatusUpdateMailNotificationMetadataPopulated extends Omit<IProcessStatusUpdateNotificationMetadataPopulated, 'step'> {
    step?: IMongoStepTemplate | null;
}

export type IMailNotificationMetadataPopulated =
    | Exclude<INotificationMetadataPopulated, IProcessReviewerUpdateNotificationMetadataPopulated | IProcessStatusUpdateNotificationMetadataPopulated>
    | IProcessReviewerUpdateMailNotificationMetadataPopulated
    | IProcessStatusUpdateMailNotificationMetadataPopulated;

export interface IMailNotification {
    viewers: string[];
    type: NotificationType;
    populatedMetaData: IMailNotificationMetadataPopulated;
}
