import { IRelationship } from './relationships';

export interface IEntity {
    templateId: string;
    properties: {
        _id: string;
        createdAt: string;
        updatedAt: string;
    } & Record<string, any>;
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: { relationship: Pick<IRelationship, 'templateId' | 'properties'>; entity: IEntity }[];
}
