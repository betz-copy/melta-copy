import { INotification, IProcessApproverUpdateNotificationMetadata } from '.';
import { IRuleBreachAlertPopulated, IRuleBreachRequestPopulated } from '../../ruleBreachService/interfaces/populated';

export interface IAlertNotificationMetadataPopulated {
    alert: IRuleBreachAlertPopulated;
}
export interface IRequestNotificationMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}
export interface IResponseNotificationMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}

export interface IProcessApproverUpdateNotificationMetadataPopulated extends Omit<IProcessApproverUpdateNotificationMetadata, 'processId'> {
    process: object; // TODO: add process interface
}
export interface INewProcessNotificationMetadataPopulated {
    process: object; // TODO: add process interface
}

export type INotificationMetadataPopulated =
    | IAlertNotificationMetadataPopulated
    | IRequestNotificationMetadataPopulated
    | IResponseNotificationMetadataPopulated
    | IProcessApproverUpdateNotificationMetadataPopulated
    | INewProcessNotificationMetadataPopulated;

export interface INotificationPopulated<T = INotificationMetadataPopulated> extends Omit<INotification<T>, 'viewers'> {}
