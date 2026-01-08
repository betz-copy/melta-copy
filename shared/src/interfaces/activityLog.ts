import { IPropertyValue } from './entity';
import { Status } from './process';

export interface IUpdatedFields {
    fieldName: string;
    oldValue: IPropertyValue;
    newValue: IPropertyValue;
}

interface IBaseActivityLog {
    timestamp: Date;
    entityId: string;
    userId: string;
}

export enum ActionsLog {
    CREATE_ENTITY = 'CREATE_ENTITY',
    DISABLE_ENTITY = 'DISABLE_ENTITY',
    ACTIVATE_ENTITY = 'ACTIVATE_ENTITY',
    VIEW_ENTITY = 'VIEW_ENTITY',
    CREATE_PROCESS = 'CREATE_PROCESS',
    UPDATE_PROCESS = 'UPDATE_PROCESS',
    UPDATE_PROCESS_STEP = 'UPDATE_PROCESS_STEP',
    DELETE_RELATIONSHIP = 'DELETE_RELATIONSHIP',
    CREATE_RELATIONSHIP = 'CREATE_RELATIONSHIP',
    DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
    UPDATE_ENTITY = 'UPDATE_ENTITY',
}

export interface IMongoBaseActivityLog extends IBaseActivityLog {
    _id: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: ActionsLog.CREATE_ENTITY | ActionsLog.DISABLE_ENTITY | ActionsLog.ACTIVATE_ENTITY | ActionsLog.VIEW_ENTITY | ActionsLog.CREATE_PROCESS;
    metadata: object;
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: ActionsLog.DELETE_RELATIONSHIP | ActionsLog.CREATE_RELATIONSHIP;
    metadata: {
        relationshipId: string;
        relationshipTemplateId: string;
        entityId: string;
    };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: ActionsLog.DUPLICATE_ENTITY;
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: ActionsLog.UPDATE_ENTITY | ActionsLog.UPDATE_PROCESS;
    metadata: { updatedFields: IUpdatedFields[] };
}

export interface IUpdateProcessStepMetadata extends IBaseActivityLog {
    action: ActionsLog.UPDATE_PROCESS_STEP;
    metadata: { updatedFields?: IUpdatedFields[]; comments?: string; status?: Status };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateProcessStepMetadata;
