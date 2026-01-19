import {
    IEntity,
    IEntityWithIgnoredRules,
    IExcelNotFoundError,
    IPropertyValue,
    IRequiredConstraint,
    IUniqueConstraint,
    IValidationError,
} from '@packages/entity';
import { ISubCompactPermissions } from '@packages/permission';
import { IRelationshipPopulated } from '@packages/relationship';
import { IUser } from '@packages/user';

export interface ICreateRelationshipMetadata {
    relationshipTemplateId: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IDeleteRelationshipMetadata {
    relationshipId: string;

    relationshipTemplateId: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface ICreateEntityMetadata {
    templateId: string;
    properties: Record<string, IPropertyValue>;
}

export interface IDuplicateEntityMetadata {
    templateId: string;
    properties: Record<string, IPropertyValue>;
    entityIdToDuplicate: string;
}

export interface IUpdateEntityMetadata {
    entityId: string;
    before?: Record<string, IPropertyValue>;
    updatedFields: Record<string, IPropertyValue>;
}

export interface IUpdateMultipleEntitiesMetadata extends Array<IUpdateEntityMetadata> {}

export interface IUpdateEntityStatusMetadata {
    entityId: string;
    disabled: boolean;
}

export interface ICronjobRunMetadata {
    entityId: string; // on whom cronjob run was initiated
}

export interface ICreateRelationshipMetadataPopulated extends Omit<ICreateRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
}

export interface IDeleteRelationshipMetadataPopulated extends Omit<IDeleteRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
}

export interface ICreateEntityMetadataPopulated extends ICreateEntityMetadata {}

export interface IDuplicateEntityMetadataPopulated extends ICreateEntityMetadata {
    entityToDuplicate: IEntity | string | null;
}

export interface IUpdateEntityStatusMetadataPopulated extends Omit<IUpdateEntityStatusMetadata, 'entityId'> {
    entity: IEntity | null;
}
export interface IUpdateEntityMetadataPopulated extends Omit<IUpdateEntityMetadata, 'entityId'> {
    entity: IEntity | null;
}
export interface ICreateOrDuplicateEntityMetadataPopulated {
    templateId: string;
    properties: Record<string, IPropertyValue>;
}

export interface IUpdateMultipleEntitiesMetadataPopulated extends Array<IUpdateEntityMetadataPopulated> {}

export interface ICronjobRunMetadataPopulated {
    entity: IEntity | null;
}

export type IActionMetadata =
    | ICreateRelationshipMetadata
    | IDeleteRelationshipMetadata
    | ICreateEntityMetadata
    | IDuplicateEntityMetadata
    | IUpdateEntityMetadata
    | IUpdateEntityStatusMetadata
    | IUpdateMultipleEntitiesMetadata
    | ICronjobRunMetadata;

export type IActionMetadataPopulated =
    | ICreateRelationshipMetadataPopulated
    | IDeleteRelationshipMetadataPopulated
    | ICreateEntityMetadataPopulated
    | IDuplicateEntityMetadataPopulated
    | IUpdateEntityMetadataPopulated
    | IUpdateEntityStatusMetadataPopulated
    | IUpdateMultipleEntitiesMetadataPopulated
    | ICronjobRunMetadataPopulated;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    CreateEntity = 'create-entity',
    DuplicateEntity = 'duplicate-entity',
    UpdateEntity = 'update-entity',
    UpdateStatus = 'update-status',
    UpdateMultipleEntities = 'update-multiple-entities',
    CreateClientSideEntity = 'create-client-side-entity',
    CronjobRun = 'cronjob-run',
}

export interface IActionPopulated {
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
}

export enum ActionErrors {
    validation = 'VALIDATION',
    unique = 'UNIQUE',
    required = 'REQUIRED',
    filterValidation = 'FILTER_VALIDATION',
    notFound = 'NOT_FOUND',
}

export enum basicFilterOperationTypes {
    equals = 'equals',
    notEqual = 'notEqual',
    blank = 'blank',
    notBlank = 'notBlank',
}
export enum numberFilterOperationTypes {
    lessThan = 'lessThan',
    lessThanOrEqual = 'lessThanOrEqual',
    greaterThan = 'greaterThan',
    greaterThanOrEqual = 'greaterThanOrEqual',
    inRange = 'inRange',
}
export enum textFilterOperationTypes {
    contains = 'contains',
    notContains = 'notContains',
    startsWith = 'startsWith',
    endsWith = 'endsWith',
}

export enum relativeDateFilters {
    thisWeek = 'thisWeek',
    thisMonth = 'thisMonth',
    thisYear = 'thisYear',
    untilToday = 'untilToday',
    fromToday = 'fromToday',
}

export enum FilterTypes {
    text = 'text',
    number = 'number',
    date = 'date',
    set = 'set',
}

export interface IAgGridTextFilter {
    filterType: FilterTypes.text;
    type: basicFilterOperationTypes | textFilterOperationTypes;
    filter?: string;
}

export interface IAgGridNumberFilter {
    filterType: FilterTypes.number;
    type: basicFilterOperationTypes | numberFilterOperationTypes;
    filter?: number | string;
    filterTo?: number; // only inRange type
}

export interface IAgGridDateFilter {
    filterType: FilterTypes.date;
    type: basicFilterOperationTypes | numberFilterOperationTypes | relativeDateFilters;
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

export interface IAction {
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
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

export type IFailedEntityError = {
    type: ActionErrors;
    metadata: IValidationError | IUniqueConstraint | IRequiredConstraint | IExcelNotFoundError;
};

export type IFailedEntity = {
    properties: Record<string, IPropertyValue>;
    errors: IFailedEntityError[];
};

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
