import { IRuleBreach } from "./ruleBreach";

// Rule Breach Alerts
export interface IRuleBreachAlert extends IRuleBreach {}

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

export * from "./agGrid";
export * from "./ruleBreach";
export * from "./actionMetadata";
