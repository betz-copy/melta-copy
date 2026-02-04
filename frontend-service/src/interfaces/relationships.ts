import { IEntity } from './entities';

export interface IRelationship {
    templateId: string;
    properties: object & {
        _id: string;
    };
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IMongoRelationship extends Omit<IRelationship, 'properties'> {
    properties: object & {
        _id: string;
        createdAt: Date;
        updatedAt: Date;
    };
}

export interface IRelationshipPopulated {
    templateId: string;
    properties: object & {
        _id: string;
    };
    sourceEntity: IEntity;
    destinationEntity: IEntity;
}
