import { IRelationship } from './relationships';

export interface IEntity {
    templateId: string;
    properties: object & {
        _id: string;
    };
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: { relationship: Pick<IRelationship, 'templateId' | 'properties'>; entity: IEntity }[];
}
