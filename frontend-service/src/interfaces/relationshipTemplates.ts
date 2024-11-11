import { IMongoEntityTemplatePopulated } from './entityTemplates';

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    isProperty?: boolean;
}

export interface IConvertToRelationshipField {
    fieldName: string; // שם השדה באנגלית לדיבי
    displayFieldName: string; // שם השדה לתצוגה
    relatedTemplateField: string; // של הישות יעד - שם השדה חובה
    relationshipTemplateDirection: 'outgoing' | 'incoming'; // כיוון הקשר outgoing/incoming
    sourceEntityId: string;
    destinationEntityId: string;
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

export interface ISearchRelationshipTemplatesBody {
    search?: string;
    ids?: string[];
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
    limit: number;
    skip: number;
}
