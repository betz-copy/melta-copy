import { IEntity } from '../entities';

export interface ICreateRelationshipMetadata {
    relationshipTemplateId: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface ICreateRelationshipMetadataPopulated {
    relationshipTemplateId: string;
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
}

export interface IDeleteRelationshipMetadata {
    relationshipId: string;
    relationshipTemplateId: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IDeleteRelationshipMetadataPopulated {
    relationshipId: string;
    relationshipTemplateId: string;
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
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

export interface IUpdateEntityStatusMetadataPopulated {
    entity: IEntity | null;
    disabled: boolean;
}
export interface IUpdateEntityMetadataPopulated {
    entity: IEntity | null;
    before?: Record<string, any>;
    updatedFields: Record<string, any>;
}

export type IActionMetadata = ICreateRelationshipMetadata | IDeleteRelationshipMetadata | IUpdateEntityMetadata | IUpdateEntityStatusMetadata;
export type IActionMetadataPopulated =
    | ICreateRelationshipMetadataPopulated
    | IDeleteRelationshipMetadataPopulated
    | IUpdateEntityMetadataPopulated
    | IUpdateEntityStatusMetadataPopulated;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    UpdateEntity = 'update-entity',
    UpdateStatus = 'update-status',
}
