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
    updatedFields: Record<string, any>;
    before?: Record<string, any>;
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

export interface IAction {
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
}
