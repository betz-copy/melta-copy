interface IBaseActivityLog {
    timestamp: Date;
    entityId: string;
    userId: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY';
    metadata: {};
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: 'UPDATE_ENTITY';
    metadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
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

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IUpdateEntityMetadata;
