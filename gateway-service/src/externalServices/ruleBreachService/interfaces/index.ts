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

export interface IUpdateEntityMetadata {
    entityId: string;
    before?: Record<string, any>;
    updatedFields: Record<string, any>;
}

export interface IUpdateEntityStatusMetadata {
    entityId: string;
    disabled: boolean;
}
export type IActionMetadata = ICreateRelationshipMetadata | IDeleteRelationshipMetadata | IUpdateEntityMetadata | IUpdateEntityStatusMetadata;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    UpdateEntity = 'update-entity',
    UpdateStatus = 'update-status',
}

export interface IBrokenRule {
    ruleId: string;
    relationshipIds: string[];
}

export interface IRuleBreach<T = IActionMetadata> {
    originUserId: string;
    actions: {
        actionType: ActionTypes;
        actionMetadata: T;
    }[];
    brokenRules: IBrokenRule[]; // TODO - heree - this is the right way!
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

export const isCreateRelationshipRuleBreach = (actionType: ActionTypes) => actionType === ActionTypes.CreateRelationship;
export const isDeleteRelationshipRuleBreach = (actionType: ActionTypes) => actionType === ActionTypes.DeleteRelationship;
export const isUpdateEntityRuleBreach = (actionType: ActionTypes) => actionType === ActionTypes.UpdateEntity;
export const isUpdateEntityStatusRuleBreach = (actionType: ActionTypes) => actionType === ActionTypes.UpdateStatus;
