import { IEntity } from '../../instanceService/interfaces/entities';
import { IDeleteProcessNotificationMetadata, INotification, IProcessStatusUpdateNotificationMetadata } from '.';
import { IMongoProcessInstancePopulated, IMongoProcessInstanceWithSteps } from '../../processService/interfaces/processInstance';
import { IMongoStepInstancePopulated } from '../../processService/interfaces/stepInstance';
import { IRuleBreachAlertPopulated, IRuleBreachRequestPopulated } from '../../ruleBreachService/interfaces/populated';
import { IMongoStepTemplate } from '../../processService/interfaces/stepTemplate';

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
    process: IMongoProcessInstancePopulated | IMongoProcessInstanceWithSteps | null;
    addedSteps: (IMongoStepInstancePopulated | IMongoStepTemplate | null)[];
    deletedSteps: (IMongoStepInstancePopulated | IMongoStepTemplate | null)[];
    unchangedSteps: (IMongoStepInstancePopulated | null)[];
}

export interface IProcessStatusUpdateNotificationMetadataPopulated extends Pick<IProcessStatusUpdateNotificationMetadata, 'status'> {
    process: IMongoProcessInstancePopulated | IMongoProcessInstanceWithSteps | null;
    step?: IMongoStepInstancePopulated | IMongoStepTemplate | null;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | IMongoProcessInstanceWithSteps | null;
}
export interface IDeleteProcessNotificationMetadataPopulated extends IDeleteProcessNotificationMetadata {}
export interface IArchiveProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | IMongoProcessInstanceWithSteps | null;
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
