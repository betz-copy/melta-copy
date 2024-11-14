import { Date as Neo4jDate, DateTime as Neo4jDateTime } from 'neo4j-driver';
import { ICauseInstance } from '@microservices/shared/src/interfaces/ruleBreach/ruleBreach';
import { IEntity } from '@microservices/shared/src/interfaces/entity';
import { IRelationship } from '@microservices/shared/src/interfaces/relationship';

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
