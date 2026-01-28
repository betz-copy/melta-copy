import { ActionTypes, IAction, IActionMetadataPopulated, IActionPopulated, ICreateEntityMetadata } from '@packages/action';
import {
    ActionErrors,
    IConnection,
    IEntity,
    IFailedEntity,
    IPropertyValue,
    IRequiredConstraint,
    IUniqueConstraint,
    IValidationError,
} from '@packages/entity';
import { ISubCompactPermissions } from '@packages/permission';
import { IRelationshipPopulated } from '@packages/relationship';
import { IUser } from '@packages/user';

export enum BasicFilterOperationTypes {
    equals = 'equals',
    notEqual = 'notEqual',
    blank = 'blank',
    notBlank = 'notBlank',
}
export enum NumberFilterOperationTypes {
    lessThan = 'lessThan',
    lessThanOrEqual = 'lessThanOrEqual',
    greaterThan = 'greaterThan',
    greaterThanOrEqual = 'greaterThanOrEqual',
    inRange = 'inRange',
}
export enum TextFilterOperationTypes {
    contains = 'contains',
    notContains = 'notContains',
    startsWith = 'startsWith',
    endsWith = 'endsWith',
}

export enum RelativeDateFilters {
    thisWeek = 'thisWeek',
    thisMonth = 'thisMonth',
    thisYear = 'thisYear',
    untilToday = 'untilToday',
    fromToday = 'fromToday',
}

export enum FilterTypes {
    text = 'text',
    string = 'string',
    number = 'number',
    date = 'date',
    set = 'set',
}

export interface IAgGridTextFilter {
    filterType: FilterTypes.text;
    type: BasicFilterOperationTypes | TextFilterOperationTypes;
    filter?: string;
}

export interface IAgGridNumberFilter {
    filterType: FilterTypes.number;
    type: BasicFilterOperationTypes | NumberFilterOperationTypes;
    filter?: number | string;
    filterTo?: number; // only inRange type
}

export interface IAgGridDateFilter {
    filterType: FilterTypes.date;
    type: BasicFilterOperationTypes | NumberFilterOperationTypes | RelativeDateFilters;
    dateFrom: string | null;
    dateTo: string | null; // only inRange type
}

export interface IAgGridSetFilter {
    filterType: FilterTypes.set;
    values: (string | IUser | null)[];
}

export type IAgGridFilterModel = IAgGridTextFilter | IAgGridNumberFilter | IAgGridDateFilter | IAgGridSetFilter;

export interface IAgGridSort {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface IUserAgGridRequest {
    search?: string;
    permissions: ISubCompactPermissions | undefined;
    workspaceIds: string[] | undefined;
    limit: number;
    step: number;
    filterModel: Record<string, IAgGridFilterModel>;
    sortModel?: IAgGridSort[];
    ids?: string[];
}
export interface IAgGridRequest {
    startRow: number;
    endRow: number;
    filterModel: Record<string, IAgGridFilterModel>;
    quickFilter?: string;
    sortModel: IAgGridSort[];
}

export type FilterQuery =
    | string
    | { $ne: string }
    | { $exists: boolean }
    | { $lt: number }
    | { $lte: number }
    | { $gt: number }
    | { $gte: number }
    | { $regex: RegExp }
    | { $not: { $regex: RegExp } }
    | { $in: (string | null)[] }
    | { $gte: number; $lte: number };

export interface ICauseInstance {
    // same format of IVariable in Formula interfaces, but with instance ids
    entityId: string;
    aggregatedRelationship?: {
        relationshipId: string;
        otherEntityId: string;
    };
}

export interface ICausesOfInstance {
    instance: ICauseInstance;
    properties: string[]; // can be empty array, if the only cause is not related to specific property (i.e. count aggregation)
}

export interface IBrokenRule {
    ruleId: string;
    failures: Array<{ entityId: string; causes: ICausesOfInstance[] }>;
}

export interface IRuleBreach {
    originUserId: string;
    actions: IAction[];
    brokenRules: IBrokenRule[];
    createdAt: Date;
    _id: string;
}

export type IEntityForBrokenRules = IEntity | string | null;
export type IRelationshipForBrokenRules = IRelationshipPopulated | string | null;

export interface ICauseInstancePopulated {
    entity: IEntityForBrokenRules;
    aggregatedRelationship?: {
        relationship: IRelationshipForBrokenRules;
        otherEntity: IEntityForBrokenRules;
    };
}

export interface ICausesOfInstancePopulated {
    instance: ICauseInstancePopulated;
    properties: string[];
}

export interface IBrokenRulePopulated extends Omit<IBrokenRule, 'failures'> {
    ruleId: string;
    failures: Array<{
        entity: IEntityForBrokenRules;
        causes: ICausesOfInstancePopulated[];
    }>;
}

export interface IRuleBreachPopulated extends Omit<IRuleBreach, 'originUserId' | 'brokenRules' | 'actions'> {
    originUser: IUser;
    brokenRules: IBrokenRulePopulated[];
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadataPopulated;
    }[];
}

export type BreachType = 'alert' | 'request';

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

export type IBrokenRuleEntity = {
    rawBrokenRules: IBrokenRule[];
    brokenRules: IBrokenRulePopulated[];
    actions: IActionPopulated[];
    rawActions: IAction[];
    entities: { properties: Record<string, IPropertyValue> }[];
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

export interface IBrokenRulesError {
    metadata: {
        errorCode: 'RULE_BLOCK';
        rawBrokenRules: IBrokenRule[];
        brokenRules: IBrokenRulePopulated[];
        actions: IActionPopulated[];
        rawActions: IAction[];
    };
}

export interface IEntityWithIgnoredRules extends ICreateEntityMetadata {
    ignoredRules: IBrokenRule[];
}

export interface IValidationErrorData {
    type: string;
    message: string;
    metadata: {
        properties: Record<string, IPropertyValue>;
        errors: { type: ActionErrors.validation; metadata: IValidationError }[];
    };
}

export type EntityData = IEntity | IFailedEntity | IConnection;
