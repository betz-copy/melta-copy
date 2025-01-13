import { IUser } from "../user";
import { IRuleBreach, IRuleBreachPopulated } from "./ruleBreach";

// Rule Breach Alerts
export interface IRuleBreachAlert extends IRuleBreach {}

export interface IRuleBreachAlertPopulated extends IRuleBreachPopulated {}

// Rule Breach Requests
export enum RuleBreachRequestStatus {
  Pending = "pending",
  Approved = "approved",
  Denied = "denied",
  Canceled = "canceled",
}

export interface IRuleBreachRequest extends IRuleBreach {
  reviewerId?: string;
  reviewedAt?: Date;
  status: RuleBreachRequestStatus;
}

export interface IRuleBreachRequestPopulated extends IRuleBreachPopulated {
  reviewer?: IUser;
  reviewedAt?: Date;
  status: RuleBreachRequestStatus;
}

export * from "./agGrid";
export * from "./ruleBreach";
export * from "./actionMetadata";
