export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    isProperty?: boolean;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchRelationshipTemplatesBody {
    search?: string;
    ids?: string[];
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
    limit?: number;
    skip?: number;
}
