import { IEntity } from '../../instanceService/interfaces/entities';
import { IDeleteProcessNotificationMetadata, INotification, IProcessStatusUpdateNotificationMetadata } from '.';
import { IMongoProcessInstancePopulated } from '../../processService/interfaces/processInstance';
import { IMongoStepInstancePopulated } from '../../processService/interfaces/stepInstance';
import { IRuleBreachAlertPopulated, IRuleBreachRequestPopulated } from '../../ruleBreachService/interfaces/populated';

export interface IRuleBreachAlertNotificationMetadataPopulated {
    alert: IRuleBreachAlertPopulated;
}
export interface IRuleBreachRequestNotificationMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}
export interface IRuleBreachResponseNotificationMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}

export interface IProcessReviewerUpdateNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | null;
    addedSteps: (IMongoStepInstancePopulated | null)[];
    deletedSteps: (IMongoStepInstancePopulated | null)[];
    unchangedSteps: (IMongoStepInstancePopulated | null)[];
}
export interface IProcessStatusUpdateNotificationMetadataPopulated extends Pick<IProcessStatusUpdateNotificationMetadata, 'status'> {
    process: IMongoProcessInstancePopulated | null;
    step?: IMongoStepInstancePopulated | null;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | null;
}
export interface IDeleteProcessNotificationMetadataPopulated extends IDeleteProcessNotificationMetadata {}
export interface IArchiveProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | null;
    isArchived?: boolean;
}
export interface IDateAboutToExpireMetadataPopulated {
    entity: IEntity | null;
    propertyName: string;
    datePropertyValue: Date;
}

export type INotificationMetadataPopulated =
    | IRuleBreachAlertNotificationMetadataPopulated
    | IRuleBreachRequestNotificationMetadataPopulated
    | IRuleBreachResponseNotificationMetadataPopulated
    | IProcessReviewerUpdateNotificationMetadataPopulated
    | IProcessStatusUpdateNotificationMetadataPopulated
    | INewProcessNotificationMetadataPopulated
    | IDateAboutToExpireMetadataPopulated
    | IDeleteProcessNotificationMetadataPopulated
    | IArchiveProcessNotificationMetadataPopulated;

export interface INotificationPopulated<T = INotificationMetadataPopulated> extends Omit<INotification<T>, 'viewers'> {}
