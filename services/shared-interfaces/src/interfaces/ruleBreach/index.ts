import { IRequiredConstraint, IUniqueConstraint, IValidationError } from '../entity';
import { IUser } from '../user';
import { ActionErrors, ActionTypes, IActionMetadataPopulated } from './actionMetadata';
import { IAction, IBrokenRule, IBrokenRulePopulated, IRuleBreach, IRuleBreachPopulated } from './ruleBreach';

// Rule Breach Alerts
export interface IRuleBreachAlert extends IRuleBreach {}

export interface IRuleBreachAlertPopulated extends IRuleBreachPopulated {}

// Rule Breach Requests
export enum RuleBreachRequestStatus {
    Pending = 'pending',
    Approved = 'approved',
    Denied = 'denied',
    Canceled = 'canceled',
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

export type IFailedEntity = {
    properties: Record<string, any>;
    errors: { type: ActionErrors; metadata: IValidationError | IUniqueConstraint | IRequiredConstraint }[];
};

export type IActionPopulated = {
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
};

export type IBrokenRuleEntity = {
    rawBrokenRules: IBrokenRule[];
    brokenRules: IBrokenRulePopulated[];
    actions: IActionPopulated[];
    rawActions: IAction[];
    entities: { properties: Record<string, any> }[];
};

export * from './agGrid';
export * from './ruleBreach';
export * from './actionMetadata';
