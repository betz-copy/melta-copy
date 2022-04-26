export interface IEntity {
    _id: string;
    templateId: string;
    properties: object;
}

export interface IRelationshipEntity {
    _id: string;
    templateId: string;
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: { relationship: IRelationshipEntity; entity: IEntity }[];
}
