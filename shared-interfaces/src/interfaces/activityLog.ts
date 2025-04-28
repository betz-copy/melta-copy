export interface IUpdatedFields {
    fieldName: string;
    oldValue: any;
    newValue: any;
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
    DELETE_RELATIONSHIP = 'DELETE_RELATIONSHIP',
    CREATE_RELATIONSHIP = 'CREATE_RELATIONSHIP',
    DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
    UPDATE_ENTITY = 'UPDATE_ENTITY',
}

export interface IMongoBaseActivityLog extends IBaseActivityLog {
    _id: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY';
    metadata: object;
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    metadata: {
        relationshipId: string;
        relationshipTemplateId: string;
        entityId: string;
    };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: 'DUPLICATE_ENTITY';
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: 'UPDATE_ENTITY';
    metadata: {
        updatedFields: [{ fieldName: string; oldValue: any; newValue: any }];
    };
}

export enum Action {
    'DELETE_RELATIONSHIP',
    'CREATE_RELATIONSHIP',
    'UPDATE_ENTITY',
    'CREATE_ENTITY',
    'DISABLE_ENTITY',
    'ACTIVATE_ENTITY',
    'VIEW_ENTITY',
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata;

interface IMongoEmptyMetadata extends IMongoBaseActivityLog {
    action: ActionsLog.CREATE_ENTITY | ActionsLog.DISABLE_ENTITY | ActionsLog.ACTIVATE_ENTITY | ActionsLog.VIEW_ENTITY;
    metadata: object;
}

interface IMongoRelationshipMetadata extends IMongoBaseActivityLog {
    action: ActionsLog.DELETE_RELATIONSHIP | ActionsLog.CREATE_RELATIONSHIP;
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IMongoDuplicateEntityMetadata extends IMongoBaseActivityLog {
    action: ActionsLog.DUPLICATE_ENTITY;
    metadata: { entityIdDuplicatedFrom: string };
}

interface IMongoUpdateEntityMetadata extends IMongoBaseActivityLog {
    action: ActionsLog.UPDATE_ENTITY;
    metadata: { updatedFields: IUpdatedFields[] };
}

export type IMongoActivityLog = IMongoEmptyMetadata | IMongoRelationshipMetadata | IMongoDuplicateEntityMetadata | IMongoUpdateEntityMetadata;
