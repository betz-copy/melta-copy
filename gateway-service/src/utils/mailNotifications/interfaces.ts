import { NotificationType } from '../../externalServices/notificationService/interfaces';
import {
    INotificationMetadataPopulated,
    IProcessReviewerUpdateNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';
import { IMongoProcessInstanceWithSteps } from '../../externalServices/processService/interfaces/processInstance';
import { IMongoStepTemplate } from '../../externalServices/processService/interfaces/stepTemplate';

export interface IProcessReviewerUpdateMailNotificationMetadataPopulated {
    process: IMongoProcessInstanceWithSteps;
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
