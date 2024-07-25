import { Document } from 'mongoose';

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    isProperty: boolean;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate, Document<string> {
    _id: string;
}
