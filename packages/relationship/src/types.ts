import { IEntity, IPropertyValue } from '@packages/entity';
import { IRelationshipReference } from '@packages/entity-template';
import { Transaction } from 'neo4j-driver';

export interface IRelationship {
    templateId: string;
    properties: Record<string, IPropertyValue>;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IDeleteRelationshipReference {
    relationshipReference: IRelationshipReference;
    relatedEntityId: string;
    originalEntityId: string;
    transaction: Transaction;
}

export interface IRelationshipPopulated extends Omit<IRelationship, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity;
    destinationEntity: IEntity;
}
