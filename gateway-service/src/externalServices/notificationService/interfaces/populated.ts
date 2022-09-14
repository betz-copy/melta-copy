import { INotification } from '.';
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

export type INotificationMetadataPopulated =
    | IAlertNotificationMetadataPopulated
    | IRequestNotificationMetadataPopulated
    | IResponseNotificationMetadataPopulated;

export interface INotificationPopulated<T = INotificationMetadataPopulated> extends Omit<INotification<T>, 'viewers'> {}
