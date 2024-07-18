import { IMongoEntityTemplatePopulated } from './entityTemplates';

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    isProperty: boolean;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export type IMongoRelationshipTemplatePopulated = Omit<IMongoRelationshipTemplate, 'sourceEntityId' | 'destinationEntityId'> & {
    sourceEntity: IMongoEntityTemplatePopulated;
    destinationEntity: IMongoEntityTemplatePopulated;
};

export type IRelationshipTemplateMap = Map<string, IMongoRelationshipTemplate>;
