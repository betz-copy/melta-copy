import { IMongoStepTemplate } from '@microservices/shared/src/interfaces/process/templates/step';
import { IMongoStepInstancePopulated } from '@microservices/shared/src/interfaces/process/instances/step';
import {
    IMongoProcessInstanceReviewerPopulated,
    IMongoProcessInstancePopulated,
} from '@microservices/shared/src/interfaces/process/instances/process';
import { IEntity } from '../../instanceService/interfaces/entities';
import { IDeleteProcessNotificationMetadata, INotification, IProcessStatusUpdateNotificationMetadata } from '.';
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
    process: IMongoProcessInstanceReviewerPopulated | IMongoProcessInstancePopulated | null;
    addedSteps: (IMongoStepInstancePopulated | IMongoStepTemplate | null)[];
    deletedSteps: (IMongoStepInstancePopulated | IMongoStepTemplate | null)[];
    unchangedSteps: (IMongoStepInstancePopulated | null)[];
}

export interface IProcessStatusUpdateNotificationMetadataPopulated extends Pick<IProcessStatusUpdateNotificationMetadata, 'status'> {
    process: IMongoProcessInstanceReviewerPopulated | IMongoProcessInstancePopulated | null;
    step?: IMongoStepInstancePopulated | IMongoStepTemplate | null;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstanceReviewerPopulated | IMongoProcessInstancePopulated | null;
}
export interface IDeleteProcessNotificationMetadataPopulated extends IDeleteProcessNotificationMetadata {}
export interface IArchiveProcessNotificationMetadataPopulated {
    process: IMongoProcessInstanceReviewerPopulated | IMongoProcessInstancePopulated | null;
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
