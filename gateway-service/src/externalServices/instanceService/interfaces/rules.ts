import { IEntity } from './entities';
import { IRelationship } from './relationships';

export interface IConnection {
    sourceEntity: IEntity;
    relationship: IRelationship;
    destinationEntity: IEntity;
}
