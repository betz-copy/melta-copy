import { IRequiredConstraint, IUniqueConstraint, IValidationError } from '../../instanceService/interfaces/entities';
import { IActionMetadataPopulated, IBrokenRulePopulated } from './populated';

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
    properties: Record<string, any>;
}

export interface IDuplicateEntityMetadata {
    templateId: string;
    properties: Record<string, any>;
    entityIdToDuplicate: string;
}

export interface IUpdateEntityMetadata {
    entityId: string;
    before?: Record<string, any>;
    updatedFields: Record<string, any>;
}

export interface IUpdateEntityStatusMetadata {
    entityId: string;
    disabled: boolean;
}
export type IActionMetadata =
    | ICreateRelationshipMetadata
    | IDeleteRelationshipMetadata
    | ICreateEntityMetadata
    | IDuplicateEntityMetadata
    | IUpdateEntityMetadata
    | IUpdateEntityStatusMetadata;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    CreateEntity = 'create-entity',
    DuplicateEntity = 'duplicate-entity',
    UpdateEntity = 'update-entity',
    UpdateStatus = 'update-status',
}

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

export enum RuleBreachRequestStatus {
    Pending = 'pending',
    Approved = 'approved',
    Denied = 'denied',
    Canceled = 'canceled',
}

export interface IRuleBreachAlert extends IRuleBreach {}
export interface IRuleBreachRequest extends IRuleBreach {
    reviewerId?: string;
    reviewedAt?: Date;
    status: RuleBreachRequestStatus;
}

export enum ActionErrors {
    validation = 'VALIDATION',
    unique = 'UNIQUE',
    required = 'REQUIRED',
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
