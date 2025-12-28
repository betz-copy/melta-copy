import { IEntity } from '../entity';

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
    properties: Record<string, any>;
}

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
    | ICronjobRunMetadata;

export type IActionMetadataPopulated =
    | ICreateRelationshipMetadataPopulated
    | IDeleteRelationshipMetadataPopulated
    | ICreateEntityMetadataPopulated
    | IDuplicateEntityMetadataPopulated
    | IUpdateEntityMetadataPopulated
    | IUpdateEntityStatusMetadataPopulated
    | ICronjobRunMetadataPopulated;

export enum ActionTypes {
    CreateRelationship = 'create-relationship',
    DeleteRelationship = 'delete-relationship',
    CreateEntity = 'create-entity',
    DuplicateEntity = 'duplicate-entity',
    UpdateEntity = 'update-entity',
    UpdateStatus = 'update-status',
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
