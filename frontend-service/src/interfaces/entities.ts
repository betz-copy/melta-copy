export interface IEntity {
    templateId: string;
    properties: object & {
        _id: string;
    };
}

export interface IRelationshipEntity {
    _id: string;
    templateId: string;
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: { relationship: IRelationshipEntity; entity: IEntity }[];
}
