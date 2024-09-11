export interface IRelationship {
    templateId: string;
    properties: Record<string, any>;
    sourceEntityId: string;
    destinationEntityId: string;
    _id: string;
}
