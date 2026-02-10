import { ICauseInstance } from '@packages/rule-breach';
import { Date as Neo4jDate, DateTime as Neo4jDateTime } from 'neo4j-driver';

export interface ICause {
    instance: ICauseInstance;
    property?: string; // specifies if cause related to specific property. without property means a cause of instance as a whole, for example for count aggregation
    value?: string | number | boolean | Neo4jDate<number> | Neo4jDateTime<number>;
}
