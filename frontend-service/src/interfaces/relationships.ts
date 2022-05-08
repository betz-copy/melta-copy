export interface IRelationship {
    templateId: string;
    properties: object & {
        _id: string;
    };
    sourceEntityId: string;
    destinationEntityId: string;
}
