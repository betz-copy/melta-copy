import { IMongoProps } from '@packages/common';
import { IMongoEntityTemplateWithConstraintsPopulated, IRelationshipReference, ISearchBody } from '@packages/entity-template';

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    isProperty?: boolean;
}

export interface IConvertToRelationshipField {
    fieldName: string;
    displayFieldName: string;
    relationshipReference: IRelationshipReference;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate, IMongoProps {}

export type IMongoRelationshipTemplatePopulated = Omit<IMongoRelationshipTemplate, 'sourceEntityId' | 'destinationEntityId'> & {
    sourceEntity: IMongoEntityTemplateWithConstraintsPopulated;
    destinationEntity: IMongoEntityTemplateWithConstraintsPopulated;
};

export interface ISearchRelationshipTemplatesBody extends ISearchBody {
    ids?: string[];
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
}

export type IRelationshipTemplateMap = Map<string, IMongoRelationshipTemplate>;
