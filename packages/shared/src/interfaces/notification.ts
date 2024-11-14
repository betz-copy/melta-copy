import { Status } from "./process/instances/process";

export enum NotificationType {
  ruleBreachAlert = "ruleBreachAlert",
  ruleBreachRequest = "ruleBreachRequest",
  ruleBreachResponse = "ruleBreachResponse",

  processReviewerUpdate = "processReviewerUpdate",
  processStatusUpdate = "processStatusUpdate",
  newProcess = "newProcess",
  deleteProcess = "deleteProcess",
  archivedProcess = "archivedProcess",

  dateAboutToExpire = "dateAboutToExpire",
}

export interface IRuleBreachAlertNotificationMetadata {
  alertId: string;
}

export interface IRuleBreachRequestNotificationMetadata {
  requestId: string;
}
export interface IRuleBreachResponseNotificationMetadata {
  requestId: string;
}

export interface IProcessReviewerUpdateNotificationMetadata {
  processId: string;
  addedStepIds: string[];
  deletedStepIds: string[];
  unchangedStepIds: string[];
}
export interface IProcessStatusUpdateNotificationMetadata {
  processId: string;
  stepId?: string;
  status: Status;
}
export interface INewProcessNotificationMetadata {
  processId: string;
}
export interface IDeleteProcessNotificationMetadata {
  processName: string;
}
export interface IArchiveProcessNotificationMetadata {
  processId: string;
  isArchived?: boolean;
}
export interface IDateAboutToExpireNotificationMetadata {
  entityId: string;
  propertyName: string;
  datePropertyValue: Date;
}

export type INotificationMetadata =
  | IRuleBreachAlertNotificationMetadata
  | IRuleBreachRequestNotificationMetadata
  | IRuleBreachResponseNotificationMetadata
  | IProcessReviewerUpdateNotificationMetadata
  | IProcessStatusUpdateNotificationMetadata
  | INewProcessNotificationMetadata
  | IDateAboutToExpireNotificationMetadata
  | IDeleteProcessNotificationMetadata
  | IArchiveProcessNotificationMetadata;

export interface INotification<T = INotificationMetadata> {
  viewers: string[];
  type: NotificationType;
  metadata: T;
  createdAt: Date;
}

export type INotificationCountGroups = Record<string, NotificationType[]>;

export interface INotificationGroupCountDetails {
  groups: Record<string, number>;
  total: number;
}

export interface IBasicNotificationQuery {
  types?: NotificationType[];
  startDate?: Date;
  endDate?: Date;
  viewerId?: string;
}
