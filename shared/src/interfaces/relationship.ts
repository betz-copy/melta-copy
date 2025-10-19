import { Transaction } from 'neo4j-driver';
import { IEntity } from './entity';
import { IRelationshipReference } from './entityTemplate';

/* eslint-disable no-shadow */
export interface IRelationship {
    templateId: string;
    properties: Record<string, any>;
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
