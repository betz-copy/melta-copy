export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    properties: {
        type: 'object';
        properties: { [n: string]: { type: 'string' | 'number' | 'boolean'; title: string; format?: string } };
        required: string[];
    };
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate {
    _id: string;
}
