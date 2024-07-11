import { Date as Neo4jDate, DateTime as Neo4jDateTime } from 'neo4j-driver';
import { IEntity } from '../../../entities/interface';
import { IRelationship } from '../../../relationships/interface';

export interface ICauseInstance {
    // same format of IVariable in Formula interfaces, but with instance ids
    entityId: string;
    aggregatedRelationship?: {
        relationshipId: string;
        otherEntityId: string;
    };
}

export interface ICauseInstancePopulated {
    entity: IEntity;
    aggregatedRelationship?: {
        relationship: IRelationship;
        otherEntity: IEntity;
    };
}

export interface ICause {
    instance: ICauseInstance;
    property?: string; // specifies if cause related to specific property. without property means a cause of instance as a whole, for example for count aggregation
    value?: string | number | boolean | Neo4jDate<number> | Neo4jDateTime<number>;
}
