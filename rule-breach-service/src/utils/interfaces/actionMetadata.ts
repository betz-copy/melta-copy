export interface ICreateRelationshipMetadata {
    relationshipId: string;
}

export interface IDeleteRelationshipMetadata {
    relationshipId: string;
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
