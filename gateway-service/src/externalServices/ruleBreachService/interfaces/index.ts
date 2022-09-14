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

export type IActionMetadata = ICreateRelationshipMetadata | IDeleteRelationshipMetadata | IUpdateEntityMetadata;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    UpdateEntity = 'update-entity',
}

export interface IBrokenRule {
    ruleId: string;
    relationshipIds: string[];
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
export const isUpdateEntityRuleBreach = (ruleBreach: Partial<IRuleBreach>): ruleBreach is IRuleBreach<IUpdateEntityMetadata> =>
    ruleBreach.actionType === ActionTypes.UpdateEntity;
