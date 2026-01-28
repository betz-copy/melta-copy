import { IEntity, IPropertyValue } from '@packages/entity';

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

export interface IAction {
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
}

export interface IActionPopulated {
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
}
