import { IEntityWithIgnoredRules, IExcelNotFoundError, IRequiredConstraint, IUniqueConstraint, IValidationError } from '../entity';
import { IUser } from '../user';
import { ActionErrors, ActionTypes, IActionMetadataPopulated, ICreateEntityMetadata } from './actionMetadata';
import { IAction, IBrokenRule, IBrokenRulePopulated, IRuleBreach, IRuleBreachPopulated } from './ruleBreach';

// Rule Breach Alerts
export interface IRuleBreachAlert extends Omit<IRuleBreach, 'originUserId'> {
    originUserId: string | null; // allow null for Cronjob rules (i.e. with getToday function)
}

export interface IRuleBreachAlertPopulated extends Omit<IRuleBreachPopulated, 'originUser'> {
    originUser: IUser | null;
}

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

export interface IError {
    type: ActionErrors;
    metadata: IValidationError | IUniqueConstraint | IRequiredConstraint;
}

export type IFailedEntityError = {
    type: ActionErrors;
    metadata: IValidationError | IUniqueConstraint | IRequiredConstraint | IExcelNotFoundError;
};

export type IFailedEntity = {
    properties: Record<string, any>;
    errors: IFailedEntityError[];
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

export interface ITablesResults {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: IFailedEntity[];
    brokenRulesEntities?: IBrokenRuleEntity;
}

export enum ExcelStepStatus {
    uploadExcel = 'uploadExcel',
    previewExcelRows = 'previewExcelRows',
    excelUploadResult = 'excelUploadResult',
}
export interface IExcelSteps {
    status: ExcelStepStatus;
    files?: Record<string, File>;
    data: ITablesResults;
    entities?: IEntityWithIgnoredRules[];
}

export interface IEditReadExcel {
    failedEntities: IFailedEntity[];
    entities: IEntityWithIgnoredRules[];
}

export * from './actionMetadata';
export * from './agGrid';
export * from './ruleBreach';
