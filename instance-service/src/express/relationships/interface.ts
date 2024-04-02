import { IEntity } from '../entities/interface';

/* eslint-disable no-shadow */
export interface IRelationship {
    templateId: string;
    properties: Record<string, any>;
    sourceEntityId: string;
    destinationEntityId: string;
}

export enum ActionType {
    CREATE_ENTITY = 'CREATE_ENTITY',
    CREATE_RELATIONSHIP = 'CREATE_RELATIONSHIP',
}

export interface IAction {
    actionType: ActionType;
    metadata: {
        relationship?: IRelationship;
        entity?: IEntity;
    };
}
