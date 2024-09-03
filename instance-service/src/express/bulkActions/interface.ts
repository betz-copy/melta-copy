import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';

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

export interface IPopulatedCreateEntityMetadata extends Omit<ICreateEntityMetadata, 'templateId'> {
    entityTemplate: IMongoEntityTemplate;
}

export interface IPopulatedUpdateEntityMetadata extends IUpdateEntityMetadata {
    entityTemplate: IMongoEntityTemplate;
}

export interface IPopulatedDuplicateEntityMetadata extends Omit<IDuplicateEntityMetadata, 'templateId'> {
    entityTemplate: IMongoEntityTemplate;
}

export type IActionMetadata =
    | ICreateRelationshipMetadata
    | IDeleteRelationshipMetadata
    | ICreateEntityMetadata
    | IDuplicateEntityMetadata
    | IUpdateEntityMetadata
    | IUpdateEntityStatusMetadata
    | IPopulatedDuplicateEntityMetadata
    | IPopulatedCreateEntityMetadata
    | IPopulatedUpdateEntityMetadata;

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
