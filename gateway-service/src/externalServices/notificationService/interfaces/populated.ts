import { INotification, IProcessStatusUpdateNotificationMetadata } from '.';
import { IEntity } from '../../instanceManager';
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
    process: IMongoProcessInstancePopulated;
    addedSteps: IMongoStepInstancePopulated[];
    deletedSteps: IMongoStepInstancePopulated[];
    unchangedSteps: IMongoStepInstancePopulated[];
}
export interface IProcessStatusUpdateNotificationMetadataPopulated extends Pick<IProcessStatusUpdateNotificationMetadata, 'status'> {
    process: IMongoProcessInstancePopulated;
    step?: IMongoStepInstancePopulated;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated;
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
    | IDateAboutToExpireMetadataPopulated;

export interface INotificationPopulated<T = INotificationMetadataPopulated> extends Omit<INotification<T>, 'viewers'> {}
