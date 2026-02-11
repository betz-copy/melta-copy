import {
    INotificationMetadataPopulated,
    IProcessReviewerUpdateNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
    NotificationType,
} from '@packages/notification';
import { IMongoProcessInstancePopulated, IMongoStepTemplate } from '@packages/process';

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
    viewersMail: string[];
    type: NotificationType;
    populatedMetaData: IMailNotificationMetadataPopulated;
}
