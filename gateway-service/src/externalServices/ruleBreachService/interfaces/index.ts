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

export interface IRuleBreach<T = IActionMetadata> {
    originUserId: string;
    brokenRules: IBrokenRule[];
    actionType: ActionTypes;
    actionMetadata: T;
    createdAt: Date;
    _id: string;
}

export enum RuleBreachRequestStatus {
    Pending = 'pending',
    Approved = 'approved',
    Denied = 'denied',
    Canceled = 'canceled',
}

export interface IRuleBreachAlert<T = IActionMetadata> extends IRuleBreach<T> {}
export interface IRuleBreachRequest<T = IActionMetadata> extends IRuleBreach<T> {
    reviewerId?: string;
    reviewedAt?: Date;
    status: RuleBreachRequestStatus;
}

export const isCreateRelationshipRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<ICreateRelationshipMetadata> =>
    ruleBreach.actionType === ActionTypes.CreateRelationship;
export const isDeleteRelationshipRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<IDeleteRelationshipMetadata> =>
    ruleBreach.actionType === ActionTypes.DeleteRelationship;
export const isCreateEntityRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<ICreateEntityMetadata> =>
    ruleBreach.actionType === ActionTypes.CreateEntity;
export const isDuplicateEntityRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<IDuplicateEntityMetadata> =>
    ruleBreach.actionType === ActionTypes.DuplicateEntity;
export const isUpdateEntityRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<IUpdateEntityMetadata> =>
    ruleBreach.actionType === ActionTypes.UpdateEntity;
export const isUpdateEntityStatusRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<IUpdateEntityStatusMetadata> =>
    ruleBreach.actionType === ActionTypes.UpdateStatus;
