export interface IUpdatedFields {
    fieldName: string;
    oldValue: any;
    newValue: any;
}

interface IBaseActivityLog {
    timestamp: Date;
    entityId: string;
    userId: string;
    _id: string;
}

export enum ActionsLog {
    CREATE_ENTITY = 'CREATE_ENTITY',
    DISABLE_ENTITY = 'DISABLE_ENTITY',
    ACTIVATE_ENTITY = 'ACTIVATE_ENTITY',
    VIEW_ENTITY = 'VIEW_ENTITY',
    DELETE_RELATIONSHIP = 'DELETE_RELATIONSHIP',
    CREATE_RELATIONSHIP = 'CREATE_RELATIONSHIP',
    DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
    UPDATE_ENTITY = 'UPDATE_ENTITY'
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: ActionsLog.CREATE_ENTITY | ActionsLog.DISABLE_ENTITY | ActionsLog.ACTIVATE_ENTITY | ActionsLog.VIEW_ENTITY;
    metadata: {};
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: ActionsLog.DELETE_RELATIONSHIP | ActionsLog.CREATE_RELATIONSHIP;
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: ActionsLog.DUPLICATE_ENTITY;
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: ActionsLog.UPDATE_ENTITY;
    metadata: { updatedFields: IUpdatedFields[] };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata;
