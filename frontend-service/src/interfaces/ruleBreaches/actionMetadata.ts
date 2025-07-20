import { IEntity } from '../entities';

export interface ICreateRelationshipMetadata {
    relationshipTemplateId: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface ICreateRelationshipMetadataPopulated {
    relationshipTemplateId: string;
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
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
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
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

export interface IUpdateMultipleEntitiesMetadata extends Array<IUpdateEntityMetadata> {}

export interface IUpdateEntityStatusMetadata {
    entityId: string;
    disabled: boolean;
}

export interface ICreateEntityMetadataPopulated extends ICreateEntityMetadata {}

export interface IDuplicateEntityMetadataPopulated extends ICreateEntityMetadata {
    entityToDuplicate: IEntity | null;
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

export interface IUpdateMultipleEntitiesMetadataPopulated extends Array<IUpdateEntityMetadataPopulated> {}

export type IActionMetadata =
    | ICreateRelationshipMetadata
    | IDeleteRelationshipMetadata
    | ICreateEntityMetadata
    | IDuplicateEntityMetadata
    | IUpdateEntityMetadata
    | IUpdateEntityStatusMetadata
    | IUpdateMultipleEntitiesMetadata;

export type IActionMetadataPopulated =
    | ICreateRelationshipMetadataPopulated
    | IDeleteRelationshipMetadataPopulated
    | ICreateEntityMetadataPopulated
    | IDuplicateEntityMetadataPopulated
    | IUpdateEntityMetadataPopulated
    | IUpdateEntityStatusMetadataPopulated
    | IUpdateMultipleEntitiesMetadataPopulated;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    CreateEntity = 'create-entity',
    DuplicateEntity = 'duplicate-entity',
    UpdateEntity = 'update-entity',
    UpdateStatus = 'update-status',
    UpdateMultipleEntities = 'update-multiple-entities',
    CreateClientSideEntity = 'create-client-side-entity',
}

export interface IAction {
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
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
}
